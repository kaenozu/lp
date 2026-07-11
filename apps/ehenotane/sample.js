/*
 * /apps/ehenotane/sample.js
 * LP上のサンプルクイズの回答処理
 * 関連ファイル: index.html, assets/styles.css
 */

(function () {
  "use strict";

  var quizData = {
    correctIndex: 1,
    correctText: "7個",
    explanation:
      "キリンの頸椎は通常7個です。首が長いのは骨の数が多いからではなく、一つ一つの頸椎が長いためです。",
    category: "生物",
    difficulty: "easy",
  };

  var choices = document.querySelectorAll(".quiz-card__choice");
  var resultArea = document.querySelector(".quiz-card__result");
  var verdictEl = document.getElementById("verdict");
  var answerEl = document.getElementById("answerText");
  var explanationEl = document.getElementById("explanationText");
  var metaEl = document.getElementById("metaInfo");
  var answered = false;

  if (!choices.length || !resultArea) return;

  function handleAnswer(index) {
    if (answered) return;
    answered = true;

    choices.forEach(function (btn) {
      btn.disabled = true;
      var idx = parseInt(btn.getAttribute("data-index"), 10);
      if (idx === quizData.correctIndex) {
        btn.classList.add("quiz-card__choice--correct");
      } else if (idx === index) {
        btn.classList.add("quiz-card__choice--incorrect");
      }
    });

    var isCorrect = index === quizData.correctIndex;
    verdictEl.textContent = isCorrect ? "正解！" : "不正解";
    verdictEl.className =
      "quiz-card__verdict" +
      (isCorrect
        ? " quiz-card__verdict--correct"
        : " quiz-card__verdict--incorrect");
    answerEl.textContent = "正解: " + quizData.correctText;
    explanationEl.textContent = quizData.explanation;
    metaEl.textContent = "カテゴリ: " + quizData.category + "　難易度: " + quizData.difficulty;

    resultArea.hidden = false;
    resultArea.focus();
  }

  choices.forEach(function (btn) {
    btn.addEventListener("click", function () {
      var idx = parseInt(btn.getAttribute("data-index"), 10);
      handleAnswer(idx);
    });
  });
})();
