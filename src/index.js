import './css/main.css';
const Game = require('./js/Game');

let game=new Game();
game.init();
game._addFailedFn(failed);
game._addSuccessFn(success);

// 失败弹框
let mask=document.getElementsByClassName("js-mask")[0];
// 得分
let score=mask.getElementsByClassName("js-score")[0];
// 重新开始
let restartBtn=mask.getElementsByClassName("js-restart")[0];
let current_score=document.getElementsByClassName("js-current-score")[0];

restartBtn.addEventListener("click",restart);

function failed() {
  score.innerText = game.score;
  mask.className="js-mask mask show";
}
function success(score) {
  current_score.innerHTML=score;
}
function restart() {
  mask.className="js-mask mask";
  game._restart();
}