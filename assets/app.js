/*
 * /assets/app.js
 * 共通の年表示と、あしたもつものLPの実画面表示を担当
 * スムーススクロールはCSSの scroll-behavior: smooth で対応
 */

document.addEventListener("DOMContentLoaded", function () {
  var yearEls = document.querySelectorAll("[data-year]");
  var currentYear = new Date().getFullYear();
  yearEls.forEach(function (el) {
    el.textContent = currentYear;
  });

  var normalizedPath = window.location.pathname
    .replace(/\/index\.html$/, "")
    .replace(/\/+$/, "");
  if (normalizedPath !== "/apps/ashita-motsumono") {
    return;
  }

  var screenshots = [
    {
      src: "/assets/apps/ashita-motsumono/screenshots/home-tomorrow.webp",
      alt: "あしたもつもののホーム画面。明日の持ち物、提出物、集金を一覧表示している",
      description: "明日の持ち物・提出物を一覧で確認し、準備状況をチェックできます。"
    },
    {
      src: "/assets/apps/ashita-motsumono/screenshots/review-extraction.webp",
      alt: "あしたもつものの読み取り結果確認画面。登録前に内容を修正できる",
      description: "おたよりから読み取った内容を確認し、登録前に修正できます。"
    },
    {
      src: "/assets/apps/ashita-motsumono/screenshots/all-complete.webp",
      alt: "あしたもつもののホーム画面。すべての準備項目が完了している",
      description: "すべての項目を完了した状態を、一覧で確認できます。"
    }
  ];

  function createScreenshotImage(screenshot, isHero) {
    var image = document.createElement("img");
    image.className = "real-app-screen";
    image.alt = screenshot.alt;
    image.width = 360;
    image.height = 640;
    image.decoding = "async";
    image.loading = isHero ? "eager" : "lazy";
    if (isHero) {
      image.setAttribute("fetchpriority", "high");
    }
    return image;
  }

  function replaceMockAfterImageLoad(mock, screenshot, isHero, onSuccess) {
    var image = createScreenshotImage(screenshot, isHero);

    image.addEventListener("load", function () {
      if (!mock.isConnected) {
        return;
      }
      mock.replaceWith(image);
      if (onSuccess) {
        onSuccess();
      }
    }, { once: true });

    image.addEventListener("error", function () {
      // 画像が取得できない場合は、配信HTMLに含まれるモックをそのまま表示する。
      image.removeAttribute("src");
    }, { once: true });

    image.src = screenshot.src;
  }

  function showRealScreenshots() {
    var heroMock = document.querySelector(".section--mock .phone-mock");
    if (heroMock) {
      replaceMockAfterImageLoad(heroMock, screenshots[0], true);
    }

    var screenshotGrid = document.querySelector(".screenshot-grid");
    if (!screenshotGrid) {
      return;
    }

    var successfulGridImages = 0;
    var screenshotItems = screenshotGrid.querySelectorAll(".screenshot-item");
    screenshotItems.forEach(function (item, index) {
      var screenshot = screenshots[index];
      if (!screenshot) {
        return;
      }

      var mock = item.querySelector(".phone-mock");
      if (mock) {
        replaceMockAfterImageLoad(mock, screenshot, false, function () {
          successfulGridImages += 1;
          if (successfulGridImages !== screenshots.length) {
            return;
          }
          var section = screenshotGrid.closest(".section");
          var subtitle = section ? section.querySelector(".section__subtitle") : null;
          if (subtitle) {
            subtitle.textContent = "現在の実装画面を、匿名のサンプルデータで表示しています。";
          }
        });
      }

      var description = item.querySelector(".screenshot-item__desc");
      if (description) {
        description.textContent = screenshot.description;
      }
    });
  }

  var screenshotStyles = document.createElement("link");
  screenshotStyles.rel = "stylesheet";
  screenshotStyles.href = "/assets/app-screenshots.css";
  screenshotStyles.addEventListener("load", showRealScreenshots, { once: true });
  document.head.appendChild(screenshotStyles);
});
