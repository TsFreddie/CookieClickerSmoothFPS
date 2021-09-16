Game.registerMod('smoothfps', {
  init: function () {
    this.storedFps = localStorageGet('modSmoothFps') || 30;
    Game.fps = this.storedFps;
    const BackupLoop = Game.Loop;

    // Destroy game loop, so we can use our own smoother one
    Game.Loop = () => {};

    this.lastFrame = window.performance.now();
    this.gameInterval = 1000 / Game.fps;

    const RAFLoop = () => {
      requestAnimationFrame(RAFLoop);
      const now = window.performance.now();
      const delta = now - this.lastFrame;
      if (Math.abs(delta - this.gameInterval) < 0.05 || delta > this.gameInterval) {
        this.lastFrame = now - (delta % this.gameInterval);
        BackupLoop();
      }
    };

    // Lauch game loop
    RAFLoop();

    const BackgroundLoop = () => {
      if (Game.visible) return;
      BackupLoop();
    };

    this.backgroundLoop = setInterval(BackgroundLoop, 1000 / Game.fps);

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
      Game.clickStr +
      '="' +
      callback +
      '">' +
      text +
      '</a>'
    );
  },

  prefMenu: function () {
    return (
      '<div class="title">Smooth framerate</div>' +
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
    localStorageSet('modSmoothFps', fps);
    this.storedFps = fps;
    if (restart) {
      Game.toSave=true;
      Game.toReload=true;
    }
  },
});
