/*
 * /assets/app.js
 * 最小限のJavaScript - フッターの年表示のみ
 * スムーススクロールはCSSの scroll-behavior: smooth で対応
 * 関連ファイル: styles.css
 */

document.addEventListener("DOMContentLoaded", function () {
  var yearEls = document.querySelectorAll("[data-year]");
  var currentYear = new Date().getFullYear();
  yearEls.forEach(function (el) {
    el.textContent = currentYear;
  });
});
