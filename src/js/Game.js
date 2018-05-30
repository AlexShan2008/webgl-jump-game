const THREE = require('three');
const DATA_CUBES = require('./cubes');
class Game {
  constructor() {
    this.config = {
      isMobile: false,
      cubes: DATA_CUBES,
      cubeStep: 6, // 默认下一个块出现的距离
      background: 0x282828,
      ground: -1,
      cubeColor: 0x3db389,
      cubeWidth: 4,
      cubeHeight: 2,
      cubeDeep: 4,
      jumperColor: 0xFF0000,
      jumperWidth: 1,
      jumperHeight: 2,
      jumperDeep: 1
    };
    this.score = 0; // 分数
    this.scene = new THREE.Scene(); // 场景
    this.camera = new THREE.OrthographicCamera(window.innerWidth / -50, window.innerWidth / 50, window.innerHeight / 50, window.innerHeight / -50, 0, 5000);
    this.cameraPros = {
      current: new THREE.Vector3(0, 0, 0),
      next: new THREE.Vector3(0, 0, 0),
    };
    this.renderer = new THREE.WebGLRenderer({ antialias: true });
    this.size = { width: window.innerWidth, height: window.innerHeight };
    this.cubes = [];
    this.cubeStat = {
      nextDir: "",
    };
    this.jumperStat = {
      ready: false,
      xSpeed: 0,
      ySpeed: 0
    };
    // 记录下落位置
    this.falledStat = {
      location: -1,
      distance: 0
    };
    this.fallingStat = {
      end: false,
      speed: 0.2
    }
  }

  init() {
    this._checkUserAgent();
    // 移动端重新设定尺寸大小
    if (this.config.isMobile) {
      this._setDefaultConfig();
    }
    this._setCamera();
    this._setRenderer();
    this._setLight();
    this._start();
    this._handleWindowResize();
    window.addEventListener("resize", () => {
      this._handleWindowResize();
    });

    let mouseEvents = (this.config.isMobile) ? {
      down: 'touchstart',
      up: 'touchend',
    } : {
        down: 'mousedown',
        up: 'mouseup',
      };
    let canvas = document.querySelector("canvas");
    canvas.addEventListener(mouseEvents.down, () => {
      this._handleMouseDown();
    });
    canvas.addEventListener(mouseEvents.up, () => {
      this._handleMouseUp()
    });
  }

  _setDefaultConfig() {
    this._setCubeStep(4);
    this.config.cubeWidth = 3;
    this.config.cubeHeight = 1.8;
    this.config.cubeDeep = 3;
    this.config.jumperWidth = 0.8;
    this.config.jumperHeight = 1.8;
    this.config.jumperDeep = 0.8;
  }

  _checkUserAgent() {
    var n = navigator.userAgent;
    if (n.match(/Android/i) || n.match(/webOS/i) || n.match(/iPhone/i) || n.match(/iPad/i) || n.match(/iPod/i) || n.match(/BlackBerry/i)) {
      this.config.isMobile = true
    }
  }

  _start() {
    this._createCube(); // 添加第一个盒子
    this._createCube(); // 添加第二个盒子
    this._createJumper();
    this._updateCamera();
  }

  _addSuccessFn(fn) {
    this.successCallback = fn;
  }

  _addFailedFn(fn) {
    this.failedCallback = fn;
  }

  _handleWindowResize() {
    this._setSize();
    this.camera.left = this.size.width / -80;
    this.camera.right = this.size.width / 80;
    this.camera.top = this.size.height / 80;
    this.camera.bottom = this.size.height / -80;
    this.camera.updateProjectionMatrix(); // 固定方法
    this.renderer.setSize(this.size.width, this.size.height);
    this._render();
  }

  _handleMouseDown() {
    let currCube = this.cubes[this.cubes.length - 2];
    if (!this.jumperStat.ready && this.jumper.scale.y > 0.02) {
      this.jumper.scale.y -= 0.01; // 压缩比例
      this.jumper.scale.y = this.jumper.scale.y < 0.5 ? 0.5 : this.jumper.scale.y;
      currCube.scale.y -= 0.01; // 压缩比例
      currCube.scale.y = currCube.scale.y < 0.5 ? 0.5 : currCube.scale.y;
      

      this.jumperStat.xSpeed += 0.006; // 0.004
      this.jumperStat.ySpeed += 0.01; // 0.008
      this._render();
      requestAnimationFrame(() => {
        this._handleMouseDown()
      })
    }
  }

  _handleMouseUp() {
    this.jumperStat.ready = true;
    // 大于等于1，说明还在空中
    if (this.jumper.position.y >= 1) {
      if (this.jumper.scale.y < 1) {
        // 恢复压缩前高度
        this.jumper.scale.y += 0.1;
      }
      if (this.cubes[this.cubes.length - 2].scale.y < 1) {
        // 恢复压缩前高度
        this.cubes[this.cubes.length - 2].scale.y += 0.02; // 压缩比例
      }

      if (this.cubeStat.nextDir === "left") {
        this.jumper.position.x -= this.jumperStat.xSpeed;
      } else {
        this.jumper.position.z -= this.jumperStat.xSpeed;
      }
      this.jumper.position.y += this.jumperStat.ySpeed;
      this.jumperStat.ySpeed -= 0.01;
      this._render();
      requestAnimationFrame(() => {
        this._handleMouseUp();
      })
    } else {
      // 已经着地
      this.jumperStat.ready = false;
      this.jumperStat.xSpeed = 0;
      this.jumperStat.ySpeed = 0;
      this.jumper.position.y = 1;  // 回调水平高度
      this.jumper.scale.y = 1; // 恢复压缩前高度

      this._checkInCube();
      if (this.falledStat.location === 1) {
        // 成功了
        this.score++;
        this._createCube(); // 创造新块
        this._updateCamera(); // 更新相机
        if (this.successCallback) {
          this.successCallback(this.score);
        }
      } else {
        // 失败
        this._falling()
      }
    }
  }
  // 检查是否掉到了盒子上
  _checkInCube() {
    // 5种情况：
    // -1：当前盒子  -10：从当前盒子掉落 
    //  1：下一个盒子 10：从下一个盒子掉落
    //  0：不在盒子上
    let distanceCur, distanceNext; // 当前盒子距离和下一个盒子的距离
    let should = (this.config.jumperWidth + this.config.cubeWidth) / 2;
    if (this.cubeStat.nextDir === "left") {
      distanceCur = Math.abs(this.jumper.position.x - this.cubes[this.cubes.length - 2].position.x);
      distanceNext = Math.abs(this.jumper.position.x - this.cubes[this.cubes.length - 1].position.x);
    } else {
      distanceCur = Math.abs(this.jumper.position.z - this.cubes[this.cubes.length - 2].position.z);
      distanceNext = Math.abs(this.jumper.position.z - this.cubes[this.cubes.length - 1].position.z);
    }
    if (distanceCur < should) {
      // 落在当前块
      this.falledStat.distance = distanceCur;
      this.falledStat.location = distanceCur < this.config.cubeWidth / 2 ? -1 : -10;
    } else if (distanceNext < should) {
      // 落在下个块
      this.falledStat.distance = distanceNext;
      this.falledStat.location = distanceNext < this.config.cubeWidth / 2 ? 1 : 10;
    } else {
      // 没有落在块上
      this.falledStat.location = 0;
    }
  }

  _falling() {
    // 10 -10 0 
    // -10 从当前盒子掉下 LeftTop RightTop
    //  10 从下一个盒子掉下 LeftTop LeftBottom RightTop RightBottom 
    // 0 none
    if (this.falledStat.location === 10) {
      if (this.cubeStat.nextDir === "left") {
        if (this.jumper.position.x > this.cubes[this.cubes.length - 1].position.x) {
          this._fallingDir("leftBottom")
        } else {
          this._fallingDir("leftTop")
        }
      } else {
        if (this.jumper.position.z > this.cubes[this.cubes.length - 1].position.z) {
          this._fallingDir("rightBottom")
        } else {
          this._fallingDir("rightTop")
        }
      }
    } else if (this.falledStat.location === -10) {
      if (this.cubeStat.nextDir === "left") {
        this._fallingDir("leftTop")
      } else {
        this._fallingDir("rightTop")
      }
    } else if (this.falledStat.location === 0) {
      this._fallingDir("none")
    }
  }
  // 计算下落位置及旋转动作
  // 1.左方向围绕Z轴方向进行旋转
  // 2.右方向围绕X轴方向进行旋转
  // 3.旋转90°
  _fallingDir(dir) {
    let offset = this.falledStat.distance - this.config.cubeWidth / 2;
    let rotateAxis = dir.includes("left") ? 'z' : "x";
    let rotateAdd = this.jumper.rotation[rotateAxis] + 0.1;
    let rotateTo = this.jumper.rotation[rotateAxis] < Math.PI / 2;
    let fallingTo = this.config.ground + this.config.jumperWidth / 2 + offset;
    if (dir === 'rightTop') {
      rotateAdd = this.jumper.rotation[rotateAxis] - 0.1;
      rotateTo = this.jumper.rotation[rotateAxis] > -Math.PI / 2;
    } else if (dir === 'rightBottom') {
      rotateAdd = this.jumper.rotation[rotateAxis] + 0.1;
      rotateTo = this.jumper.rotation[rotateAxis] < Math.PI / 2;
    } else if (dir === 'leftBottom') {
      rotateAdd = this.jumper.rotation[rotateAxis] - 0.1;
      rotateTo = this.jumper.rotation[rotateAxis] > -Math.PI / 2;
    } else if (dir === 'leftTop') {
      rotateAdd = this.jumper.rotation[rotateAxis] + 0.1;
      rotateTo = this.jumper.rotation[rotateAxis] < Math.PI / 2;
    } else if (dir === 'none') {
      rotateTo = false;
      fallingTo = this.config.ground;
    } else {
      throw Error('Arguments Error')
    }
    if (!this.fallingStat.end) {
      if (rotateTo) {
        this.jumper.rotation[rotateAxis] = rotateAdd
      } else if (this.jumper.position.y > fallingTo) {
        this.jumper.position.y -= 0.2;
      } else {
        this.fallingStat.end = true;
      }
      this._render();
      requestAnimationFrame(() => {
        this._falling()
      })
    } else {
      if (this.failedCallback) {
        this.failedCallback()
      }
    }
  }

  _setCamera() {
    this.camera.position.set(100, 100, 100);
    this.camera.lookAt(this.cameraPros.current);
  }
  // 只需要调用一次，创建一个画布环境
  _setRenderer() {
    this.renderer.setSize(this.size.width, this.size.height);
    this.renderer.setClearColor(this.config.background);
    document.body.appendChild(this.renderer.domElement);
  }

  _setLight() {
    let directionalLight = new THREE.DirectionalLight(0xffffff, 1.1);
    directionalLight.position.set(2, 10, 5);
    this.scene.add(directionalLight);
    let light = new THREE.AmbientLight(0xffffff, 0.3);
    this.scene.add(light)
  }

  _createCube() {
    let geometry = this._getGeometry();
    let material = this._getMaterial();

    let cube = new THREE.Mesh(geometry, material);

    if (this.cubes.length) {
      // 先记录最后一个方块的位置
      cube.position.x = this.cubes[this.cubes.length - 1].position.x;
      cube.position.y = this.cubes[this.cubes.length - 1].position.y;
      cube.position.z = this.cubes[this.cubes.length - 1].position.z;

      this.cubeStat.nextDir = Math.random() > 0.5 ? "left" : "right";
      if (this.cubeStat.nextDir === "left") {
        cube.position.x = cube.position.x - this._getCubeStep();
      } else {
        cube.position.z = cube.position.z - this._getCubeStep();
      }
    }
    this.cubes.push(cube);

    if (this.cubes.length > 5) {
      this.scene.remove(this.cubes.shift());
    }
    this.scene.add(cube);
    if (this.cubes.length > 1) {
      this._updateCameraPros();
    }
  }
  // 
  _setCubeStep(cubeStep) {
    this.config.cubeStep = cubeStep;
  }

  _getCubeStep() {
    return Math.round(Math.random() * 4 + this.config.cubeStep)
  }

  _createJumper() {
    let geometry = new THREE.CubeGeometry(this.config.jumperWidth, this.config.jumperHeight, this.config.jumperDeep);
    let material = new THREE.MeshLambertMaterial({ color: this.config.jumperColor });
    this.jumper = new THREE.Mesh(geometry, material);
    this.jumper.position.y = 1;
    geometry.translate(0, 1, 0);
    this.scene.add(this.jumper);
  }

  _updateCamera() {
    let cur = {
      x: this.cameraPros.current.x,
      y: this.cameraPros.current.y,
      z: this.cameraPros.current.z,
    };
    let next = {
      x: this.cameraPros.next.x,
      y: this.cameraPros.next.y,
      z: this.cameraPros.next.z,
    };
    if (cur.x > next.x || cur.z > next.z) {
      this.cameraPros.current.x -= 0.1;
      this.cameraPros.current.z -= 0.1;
      if (this.cameraPros.current.x - this.cameraPros.next.x < 0.05) {
        this.cameraPros.current.x = this.cameraPros.next.x;
      } else if (this.cameraPros.current.z - this.cameraPros.next.z < 0.05) {
        this.cameraPros.current.z = this.cameraPros.next.z;
      }
    }
    ;
    this.camera.lookAt(new THREE.Vector3(cur.x, 0, cur.z));
    this._render();
    requestAnimationFrame(() => {
      this._updateCamera();
    })
  }

  _updateCameraPros() {
    let lastIndex = this.cubes.length - 1;
    let pointA = {
      x: this.cubes[lastIndex].position.x,
      z: this.cubes[lastIndex].position.z,
    };
    let pointB = {
      x: this.cubes[lastIndex - 1].position.x,
      z: this.cubes[lastIndex - 1].position.z,
    };
    this.cameraPros.next = new THREE.Vector3((pointA.x + pointB.x) / 2, 0, (pointA.z + pointB.z) / 2);
  }

  _setSize() {
    this.size.width = window.innerWidth;
    this.size.height = window.innerHeight;
  }

  // 单独提出，因为此方法需要多次调用
  _render() {
    this.renderer.render(this.scene, this.camera);
  }

  _getGeometry() {
    return new THREE.CubeGeometry(this.config.cubeWidth, this.config.cubeHeight, this.config.cubeDeep);
  }

  _getMaterial() {
    let index = parseInt(Math.random() * DATA_CUBES.length);
    return new THREE.MeshLambertMaterial({ color: DATA_CUBES[index].cubeColor })
  }

  _restart() {
    // 重置配置
    this.score = 0;
    this.fallingStat = { end: false, speed: 0.2 };
    this.cameraPros = { current: new THREE.Vector3(0, 0, 0), next: new THREE.Vector3() };
    // 删除场景中的几何体
    this.scene.remove(this.jumper);
    let length = this.cubes.length;
    for (let i = 0; i < length; i++) {
      this.scene.remove(this.cubes.shift());
    }
    // 重新开始
    this.successCallback(this.score);
    this._start();
  }
}

module.exports = Game;
