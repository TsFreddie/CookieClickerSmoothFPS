Game.registerMod('smoothfps', {
  init: function () {
    this.storedFps = localStorageGet('modSmoothFps') || 30;
    if (this.storedFps < 1) this.storedFps = 1;
    if (this.storedFps > 480) this.storedFps = 480;
    Game.fps = this.storedFps;
    const BackupLoop = Game.Loop;

    // Destroy game loop, so we can use our own smoother one
    Game.Loop = () => {};

    this.lastFrame = 0;
    this.gameInterval = 1000 / Game.fps;

    const RedundantLoop = () => {
      if (this.lastFrame == 0) {
        this.lastFrame = window.performance.now();
        BackupLoop();
        return;
      }
      
      const now = window.performance.now();
      let delta = now - this.lastFrame;
      let loopCounter = 0;
      let lastFrame = this.lastFrame;
      let updateFrameTime = false;
      while (Math.abs(delta - this.gameInterval) < 0.05 || delta > this.gameInterval) {
        updateFrameTime = true;
        lastFrame += this.gameInterval;
        BackupLoop();
        loopCounter++;
        // We are getting more than 5 seconds of delay, reset timer
        if (loopCounter > Game.fps * 5) {
          this.lastFrame = now;
          updateFrameTime = false;
          break;
        }
        delta = now - lastFrame;
      }
      if (updateFrameTime) {
        this.lastFrame = now - (delta % this.gameInterval);
      }
    }

    const RAFLoop = () => {
      requestAnimationFrame(RAFLoop);
      RedundantLoop();
    };

    // Lauch game loop
    RAFLoop();

    const BackgroundLoop = () => {
      if (Game.visible) return;
      RedundantLoop();
    };

    this.backgroundLoop = setInterval(BackgroundLoop, 100);
    console.log("Loop setup");

    // add menu
    this.setupMenuHook();
  },

  button: function (button, text, callback) {
    if (!callback) callback = '';
    callback += "PlaySound('snd/tick.mp3');";
    return (
      '<a class="smallFancyButton option on" id="' +
      button +
      '"' +
      loc(Game.clickStr) +
      '="' +
      callback +
      '">' +
      text +
      '</a>'
    );
  },

  prefMenu: function () {
    return (
      '<div class="title">' +
      loc('Smooth framerate') +
      '</div>' +
      '<div class="listing">' +
      this.button('smoothFpsSelectFPS', 'Set Framerate', 'Game.mods.smoothfps.fpsPrompt();') +
      '<br>' +
      '</div>'
    );
  },

  setupMenuHook: function () {
    if (typeof CCSE == 'undefined') {
      const oldMenu = Game.UpdateMenu;
      const MOD = this;
      Game.UpdateMenu = function () {
        oldMenu();
        if (Game.onMenu == 'prefs') {
          let menuHTML = l('menu').innerHTML;
          menuHTML = menuHTML.replace(
            '<div style="height:128px;"></div>',
            '<div class="framed" style="margin:4px 48px;"><div class="block" style="padding:0px;margin:8px 4px;"><div class="subsection" style="padding:0px;">' +
              MOD.prefMenu() +
              '</div></div></div><div style="height:128px;"></div>'
          );
          menu.innerHTML = menuHTML;
        }
      };
    } else {
      if (Game.customOptionsMenu == null) {
        Game.customOptionsMenu = [];
      }
      Game.customOptionsMenu.push(() => {
        CCSE.AppendOptionsMenu(this.prefMenu());
      });
    }
  },

  fpsPrompt: function () {
    PlaySound('snd/tick.mp3');
    Game.Prompt(
      '<h3>' +
        loc('Enter FPS') +
        '</h3><div class="block" style="text-align:center;">' +
        '<span style="color:red">' +
        loc('Any framerate other than 30 may cause unexpected behaviour.') +
        '</span></div><div class="block"><input type="text" style="text-align:center;width:100%;" id="fpsInput" value="' +
        this.storedFps.toString() +
        '"/></div>',
      [
        [
          loc('Restart with new changes'),
          "if (l('fpsInput').value.length>0) {Game.mods.smoothfps.setFps(parseInt(l('fpsInput').value),true);Game.ClosePrompt();}",
        ],
        loc('Cancel'),
      ]
    );
    l('fpsInput').focus();
    l('fpsInput').select();
  },

  setFps: function (fps, restart = false) {
    if (fps == null || isNaN(fps)) return;
    if (fps < 1) fps = 1;
    if (fps > 480) fps = 480;
    localStorageSet('modSmoothFps', fps);
    this.storedFps = fps;
    if (restart) {
      Game.toSave = true;
      Game.toReload = true;
    }
  },
});
