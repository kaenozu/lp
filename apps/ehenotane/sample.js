/*
 * /apps/ehenotane/sample.js
 * LP上のサンプルクイズの回答処理
 * 関連ファイル: index.html, assets/styles.css
 */

(function () {
  "use strict";

  var quizData = {
    correctIndex: 2,
    correctText: "実は同じ（7個）",
    explanation:
      "キリンも人間も、通常は首の骨（頸椎）が7個あります。キリンの首が長いのは、骨の数が多いからではなく、一つ一つの頸椎が長いためです。",
    source: "出典: 国立科学博物館「動物の骨格」／東京大学総合研究博物館 比較解剖学標本",
    category: "生物",
    difficulty: "easy",
  };

  var choices = document.querySelectorAll(".quiz-card__choice");
  var resultArea = document.querySelector(".quiz-card__result");
  var verdictEl = document.getElementById("verdict");
  var answerEl = document.getElementById("answerText");
  var explanationEl = document.getElementById("explanationText");
  var metaEl = document.getElementById("metaInfo");
  var sourceEl = document.getElementById("sourceText");
  var answered = false;

  if (!choices.length || !resultArea) return;

  function handleAnswer(index) {
    if (answered) return;
    answered = true;

    choices.forEach(function (btn) {
      btn.disabled = true;
      btn.setAttribute("aria-disabled", "true");
      var idx = parseInt(btn.getAttribute("data-index"), 10);
      if (idx === quizData.correctIndex) {
        btn.classList.add("quiz-card__choice--correct");
        btn.setAttribute("aria-checked", idx === index ? "true" : "false");
      } else if (idx === index) {
        btn.classList.add("quiz-card__choice--incorrect");
        btn.setAttribute("aria-checked", "true");
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
    sourceEl.textContent = quizData.source;

    resultArea.hidden = false;
  }

  choices.forEach(function (btn) {
    btn.addEventListener("click", function () {
      var idx = parseInt(btn.getAttribute("data-index"), 10);
      handleAnswer(idx);
    });

    btn.addEventListener("keydown", function (e) {
      if (e.key === "Enter" || e.key === " ") {
        e.preventDefault();
        var idx = parseInt(btn.getAttribute("data-index"), 10);
        handleAnswer(idx);
      }
    });
  });
})();
