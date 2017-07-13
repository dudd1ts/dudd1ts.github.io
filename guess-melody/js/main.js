(function () {
'use strict';

const appElement = document.querySelector(`.app`);

const showScreen = (screenElement) => {
  appElement.replaceChild(screenElement, appElement.querySelector(`.main`));
};

var getElementFromTemplate = (template) => {
  const newElement = document.createElement(`section`);
  newElement.innerHTML = template;

  return newElement.children[0];
};

const initialState = Object.freeze({
  screenType: `welcome`,
  timeLeft: 120,
  questions: 10,
  lives: 3,
  scores: 0,
  rightAnswers: 0,
  elapsedTime: 0,
  previousElapsedTime: 0
});

const welcome = Object.freeze({
  title: `Правила игры`,
  description: `Правила просты&nbsp;— за&nbsp;2 минуты дать
    максимальное количество правильных ответов.<br>
    Удачи!`
});

const songs = [
  {
    id: 1,
    genre: `поп`,
    artist: `The Beatles`,
    imgPath: `./img/bands/beatles.jpg`,
    audioPath: `./audio/beatles-yesterday.mp3`,
  },
  {
    id: 2,
    genre: `поп`,
    artist: `Michael Jackson`,
    imgPath: `./img/bands/jackson.jpg`,
    audioPath: `./audio/michael_jackson-thriller.mp3`,
  },
  {
    id: 3,
    genre: `рок`,
    artist: `Imagine Dragons`,
    imgPath: `./img/bands/dragons.jpg`,
    audioPath: `./audio/imagine_dragons-believer.mp3`,
  },
  {
    id: 4,
    genre: `кантри`,
    artist: `Johnny Cash`,
    imgPath: `./img/bands/cash.jpg`,
    audioPath: `./audio/johnny_cash-hey_porter.mp3`,
  },
  {
    id: 5,
    genre: `рэгги`,
    artist: `Bob Marley`,
    imgPath: `./img/bands/marley.jpg`,
    audioPath: `./audio/bob_marley-dont_worry.mp3`,
  },
];

const initialResultWinData = Object.freeze({
  title: `Вы настоящий меломан!`,
  rightAnswers: 0,
  scores: 0,
  elapsedTime: 0,
  rating: 0
});

const resultLoss = Object.freeze({
  title: `Вы проиграли`,
  text: `Ничего, вам повезет в следующий раз`,
});

const statistics = [
  {time: 20, answers: 10},
  {time: 32, answers: 10},
  {time: 44, answers: 10},
  {time: 20, answers: 8},
  {time: 50, answers: 7}
];

const Animation = {
  getAnimation: (step, stepDuration, steps) => ({
    step, stepDuration, steps
  }),

  animate: (animation, callback, callbackEnd) => {
    const interval = setInterval(() => {
      const nextStep = animation.step + 1;
      if (nextStep <= animation.steps) {
        animation = Animation.getAnimation(nextStep, animation.stepDuration, animation.steps);
        callback(animation);
      } else {
        stopFn();
        if (typeof callbackEnd === `function`) {
          callbackEnd();
        }
      }
    }, animation.stepDuration);

    const stopFn = () => clearInterval(interval);

    return stopFn;
  }
};

const updateState = (element, player) => {
  element.querySelector(`.player-status`).style.width =
      `${parseInt(player.currentTime * 100 / player.duration, 10)}%`;
};


const syncState = (player, element) => {
  element.classList.toggle(`player--is-playing`, !player.paused);
};


const switchState = (state, player, element) => {
  if (player.paused) {
    player.play();
    state.stopAnimation = Animation.animate(
        Animation.getAnimation(player.currentTime, 1000, player.duration),
        (animation) => updateState(element, player));
  } else {
    player.pause();
    state.stopAnimation();
    state.stopAnimation = null;
  }

  syncState(player, element);
};


const destroyPlayer = (element, state) => {
  const player = element.querySelector(`audio`);
  const button = element.querySelector(`button`);

  if (state.stopAnimation) {
    state.stopAnimation();
  }

  player.src = null;
  button.onclick = null;
  element.innerHTML = ``;
  state = null;

  return true;
};


const initializePlayer = (element, file, autoplay = false, controllable = true) => {
  let state = {};

  const content = document.querySelector(`template`)
    .content
    .querySelector(`.player`)
    .cloneNode(true);
  const player = content.querySelector(`audio`);
  const button = content.querySelector(`button`);

  player.onloadeddata = () => {
    if (controllable) {
      button.onclick = () => switchState(state, player, content);
    }

    if (autoplay) {
      switchState(state, player, content);
    }
  };

  player.src = file;
  element.appendChild(content);
  element.classList.toggle(`player--no-controls`, !controllable);

  return () => destroyPlayer(element, state);
};

const state = {};

const getState = () => Object.assign({}, state);

const getStateProperty = (propertyName) => {
  return state[propertyName];
};

const changeState = (newState) => {
  return Object.assign(state, newState);
};

const resetState = () => {
  return Object.assign(state, initialState);
};

const answerHandler = (isCorrect) => {
  const state = getState();

  if (isCorrect) {
    state.rightAnswers++;
    // +2 очка за быстрый ответ
    if ((state.elapsedTime - state.previousElapsedTime) < 10) {
      state.scores += 2;
    } else {
      state.scores++;
    }
  } else {
    state.lives--;
  }
  state.previousElapsedTime = state.elapsedTime;
  state.questions--;

  if ((state.questions > 0) && (state.lives > 0)) {
    state.screenType = `gameLevel`;
  } else if (state.lives > 0) {
    state.screenType = `gameWin`;
  } else {
    state.screenType = `gameLoss`;
  }
  changeState(state);

  return state.screenType;
};

const getSongs = (store, amount) => {
  const songsSet = new Set();
  do {
    songsSet.add(store[Math.trunc(Math.random() * store.length)]);
  } while (songsSet.size < amount);

  return [...songsSet];
};

const renderLevelArtistScreen = () => {
  const answerTemplate = (data) => `<div class="main-answer-wrapper">
        <input class="main-answer-r" type="radio" id="answer-${data.id}" name="answer" value="val-${data.id}" />
        <label class="main-answer" for="answer-${data.id}">
          <img class="main-answer-preview" src="${data.imgPath}">
          ${data.artist}
        </label>
      </div>`;

  const template = (data) => `<section class="main main--level main--level-artist">
  <div class="main-wrap">
    <h2 class="title main-title">Кто исполняет эту песню?</h2>
    <div class="player-wrapper"></div>
    <form class="main-list">
      ${data.map(answerTemplate).join(``)}
    </form>
  </div>
  </section>`;

  const currentSongs = getSongs(songs, 3);
  const correctSong = currentSongs[Math.trunc(Math.random() * currentSongs.length)];

  const levelArtistScreen = getElementFromTemplate(template(currentSongs));

  const playerWrapper = levelArtistScreen.querySelector(`.player-wrapper`);
  initializePlayer(playerWrapper, correctSong.audioPath);

  const answersList = levelArtistScreen.querySelector(`.main-list`);
  answersList.addEventListener(`click`, (event) => {
    if (event.target.classList.contains(`main-answer-r`)) {
      let isCorrectAnswer = (event.target.id === `answer-${correctSong.id}`);
      chooseNextScreen(answerHandler(isCorrectAnswer));
    }
  });

  return levelArtistScreen;
};

const renderLevelGenreScreen = () => {
  const answerTemplate = (data) => `<div class="genre-answer">
        <div class="player-wrapper"></div>
        <input type="checkbox" name="answer" value="answer-${data.id}" id="a-${data.id}">
        <label class="genre-answer-check" for="a-${data.id}"></label>
      </div>`;

  const template = (answers, genre) => `<section class="main main--level main--level-genre">
    <h2 class="title">Выберите ${genre} трэки</h2>
    <form class="genre">
      ${answers.map(answerTemplate).join(``)}
  
      <button class="genre-answer-send" type="submit">Ответить</button>
    </form>
  </section>`;

  const currentSongs = getSongs(songs, 4);
  const correctGenre = currentSongs[Math.trunc(Math.random() * currentSongs.length)].genre;
  let correctIDs = new Set();
  currentSongs.map((song) => {
    if (song.genre === correctGenre) {
      correctIDs.add(song.id);
    }
  });

  const levelGenreScreen = getElementFromTemplate(template(currentSongs, correctGenre));

  const answerForm = levelGenreScreen.querySelector(`.genre`);
  const sendFormElement = answerForm.querySelector(`.genre-answer-send`);
  const playerWrappers = [...answerForm.querySelectorAll(`.player-wrapper`)];
  playerWrappers.map((wrapper, id) => {
    initializePlayer(wrapper, currentSongs[id].audioPath);
  });

  const answers = [...answerForm.querySelectorAll(`[name="answer"]`)];
  sendFormElement.disabled = true;

  for (let answer of answers) {
    answer.addEventListener(`change`, (() => {
      let isSomeChecked = answers.some((checkbox) => checkbox.checked);
      sendFormElement.disabled = !isSomeChecked;
    }));
  }

  // Чекбокс отмечен правильно, если его id совпадает с id любой из песен нужного жанра
  let isCorrectCheckbox = (checkbox) => [...correctIDs].some((id) => checkbox.id === `a-${id}`);

  answerForm.addEventListener(`submit`, (event) => {
    event.preventDefault();

    const checkedAnswers = answers.filter((answer) => answer.checked === true);
    // Ответ верен если выполняются 2 услоия:
    // - количество отммеченных чекбоксов совпадает с количеством песен нужного жанра;
    // - отмечены ТОЛЬКО правильные чекбоксы
    const isCorrectAnswer = () => {
      return (checkedAnswers.length === correctIDs.size) && checkedAnswers.every((answer) => isCorrectCheckbox(answer));
    };
    checkedAnswers.forEach((checkbox) => {
      checkbox.checked = false;
    });
    sendFormElement.disabled = true;

    chooseNextScreen(answerHandler(isCorrectAnswer));
  });

  return levelGenreScreen;
};

const renderResultLossScreen = () => {
  const template = (data) => `<section class="main main--result">
    <section class="logo" title="Угадай мелодию"><h1>Угадай мелодию</h1></section>
  
    <h2 class="title">${data.title}</h2>
    <div class="main-stat">${data.text}</div>
    <span role="button" tabindex="0" class="main-replay">Сыграть ещё раз</span>
  </section>`;

  const resultLossScreen = getElementFromTemplate(template(resultLoss));

  const repeatGameHandler = () => {
    repeatGame();
  };

  const replayElement = resultLossScreen.querySelector(`.main-replay`);
  replayElement.addEventListener(`click`, repeatGameHandler);

  return resultLossScreen;
};

const renderResultWinScreen = (screenData) => {
  const template = (data) => `<section class="main main--result">
    <section class="logo" title="Угадай мелодию"><h1>Угадай мелодию</h1></section>
  
    <h2 class="title">${data.title}</h2>
    <div class="main-stat">За&nbsp;${data.elapsedTime}&nbsp;секунд<br>вы&nbsp;отгадали ${data.rightAnswers}&nbsp;мелодии<br> и набрали ${data.scores} очков.</div>
    <span class="main-comparison">Это&nbsp;лучше чем у&nbsp;${data.rating}%&nbsp;игроков</span>
    <span role="button" tabindex="0" class="main-replay">Сыграть ещё раз</span>
  </section>`;

  const resultWinScreen = getElementFromTemplate(template(screenData));

  const repeatGameHandler = () => {
    repeatGame();
  };

  const replayElement = resultWinScreen.querySelector(`.main-replay`);
  replayElement.addEventListener(`click`, repeatGameHandler);

  return resultWinScreen;
};

const timerTemplate = (time) => `<div class="main-timer">
  <svg xmlns="http://www.w3.org/2000/svg" class="timer" viewBox="0 0 780 780">
    <circle
      cx="390" cy="390" r="370"
      class="timer-line"
      style="filter: url(.#blur); transform: rotate(-90deg) scaleY(-1); transform-origin: center"></circle>
  </svg>
  <div class="timer-value" xmlns="http://www.w3.org/1999/xhtml">
      <span class="timer-value-mins">0${Math.floor(time / 60)}</span><!--
      --><span class="timer-value-dots">:</span><!--
      --><span class="timer-value-secs">0${time % 60}</span>
    </div>
</div>`;

const showTimer = (time) => {
  const appElement = document.querySelector(`.app`);
  const timerElement = getElementFromTemplate(timerTemplate(time));
  appElement.insertBefore(timerElement, appElement.firstChild);
};

const formatTime = (total, passed) => {
  const minutesLeft = Math.floor((total - passed) / 60 / 1000);
  const secondsLeft = (total - passed - minutesLeft * 60 * 1000) / 1000;

  return {
    minutes: minutesLeft,
    seconds: secondsLeft
  };
};

// Окружность уменьшается за счет штриховки. Фактически, обводка состоит
// из одного длинного штриха, а пропуск за счет расстояния до следующего
// штриха. Задача правильной заливки состоит в том, чтобы правильно
// задать расстояние до следующего штриха.
//
// Из радиуса можно рассчитать длину окружности. При известной длине окружности,
// количестве шагов и номере текущего шага в анимации можно понять, на сколько
// нужно уменьшать длину окружности на текущем шаге. Для этого надо вычесть
// из нее длину одного шага умноженную на номер текущего шага.
//
// Длина окружности = 2πR
// Длина шага = Длина окружности / Количество шагов
// Пропуск = Длина шага * Номер шага
const redrawCircle = (circle, radius, animation) => {
  const length = 2 * Math.PI * radius;
  const stepLength = length / animation.steps;
  const lengthToClear = stepLength * animation.step;

  circle.setAttributeNS(null, `r`, radius.toString());
  circle.setAttributeNS(null, `stroke-dasharray`, length.toString());
  circle.setAttributeNS(null, `stroke-dashoffset`, lengthToClear.toString());

  return circle;
};


const addLeadingZero = (val) => val < 10 ? `0${val}` : val;


const redrawTimer = (timer, animation) => {
  const total = animation.stepDuration * animation.steps;
  const passed = animation.stepDuration * animation.step;
  const timeLeft = formatTime(total, passed);

  timer.querySelector(`.timer-value-mins`).textContent = addLeadingZero(timeLeft.minutes);
  timer.querySelector(`.timer-value-secs`).textContent = addLeadingZero(timeLeft.seconds);

  return timer;
};


const initializeCountdown = (time, callbackStep, callbackEnd) => {
  const element = document.querySelector(`.timer-line`);
  const radius = parseInt(element.getAttributeNS(null, `r`), 10);
  const timer = document.querySelector(`.timer-value`);

  return Animation.animate(Animation.getAnimation(0, 1000, time), (animation) => {
    redrawCircle(element, radius, animation);
    redrawTimer(timer, animation);
    callbackStep(animation.step);
  }, () => {
    if (document.querySelector(`.main--level`)) {
      timer.classList.add(`timer-value--finished`);
      changeState({screenType: `gameLoss`});
      callbackEnd();
    }
  });
};

let stopTimerFn;

const repeatGame = () => {
  showScreen(welcomeScreen);
};

const removeTimer = () => {
  const appElement = document.querySelector(`.app`);
  appElement.removeChild(document.querySelector(`.main-timer`));
  stopTimerFn();
};

const updateElapsedTime = (time) => {
  changeState({elapsedTime: time});
};

const startGame = () => {
  resetState();
  const timeLeft = getStateProperty(`timeLeft`);
  showTimer(timeLeft);
  stopTimerFn = initializeCountdown(timeLeft, updateElapsedTime, stopGameLoss);
  showScreen(renderLevelArtistScreen());
};

const stopGameWin = () => {
  removeTimer();
  const state = getState();
  const resultWinData = Object.assign({}, initialResultWinData);
  resultWinData.rightAnswers = state.rightAnswers;
  resultWinData.scores = state.scores;
  resultWinData.elapsedTime = state.elapsedTime;

  const gameStatistic = {
    time: resultWinData.elapsedTime,
    answers: resultWinData.rightAnswers
  };
  const newStatistics = statistics.slice();
  newStatistics.push(gameStatistic);
  newStatistics.sort(function (a, b) {
    return b.answers - a.answers || a.time - b.time;
  });
  resultWinData.rating = Math.floor(((newStatistics.length - (newStatistics.indexOf(gameStatistic) + 1)) / newStatistics.length) * 100);

  showScreen(renderResultWinScreen(resultWinData));
};

const stopGameLoss = () => {
  removeTimer();
  showScreen(renderResultLossScreen());
};

const showNextGameScreen = () => {
  const gameScreens = [
    renderLevelArtistScreen(),
    renderLevelGenreScreen()
  ];
  const nextScreen = gameScreens[Math.trunc(Math.random() * gameScreens.length)];
  showScreen(nextScreen);
};

const chooseNextScreen = (screenType) => {
  switch (screenType) {
    case `gameLevel`: showNextGameScreen(); break;
    case `gameWin`: stopGameWin(); break;
    case `gameLoss`: stopGameLoss(); break;
  }
};

const template = (data) => `<section class="main main--welcome">
  <section class="logo" title="Угадай мелодию"><h1>Угадай мелодию</h1></section>
  <button class="main-play">Начать игру</button>
  <h2 class="title main-title">${data.title}</h2>
  <p class="text main-text">${data.description}</p>
</section>`;

const welcomeScreen = getElementFromTemplate(template(welcome));

const startGameHandler = () => {
  startGame();
};

const startGameElement = welcomeScreen.querySelector(`.main-play`);
startGameElement.addEventListener(`click`, startGameHandler);

showScreen(welcomeScreen);

}());

//# sourceMappingURL=main.js.map
