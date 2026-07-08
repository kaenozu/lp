/*
 * /assets/app.js
 * 最小限のJavaScript - スムーススクロールとフッターの年表示
 * 関連ファイル: styles.css
 */

document.addEventListener("DOMContentLoaded", function () {
  // フッターに現在年を表示
  var yearEls = document.querySelectorAll("[data-year]");
  var currentYear = new Date().getFullYear();
  yearEls.forEach(function (el) {
    el.textContent = currentYear;
  });

  // スムーススクロール（フォールバック）
  var anchorLinks = document.querySelectorAll('a[href^="#"]');
  anchorLinks.forEach(function (link) {
    link.addEventListener("click", function (e) {
      var targetId = link.getAttribute("href");
      if (targetId === "#") return;
      var target = document.querySelector(targetId);
      if (target) {
        e.preventDefault();
        target.scrollIntoView({ behavior: "smooth", block: "start" });
      }
    });
  });
});
