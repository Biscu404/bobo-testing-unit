/* Stand Battle Arena — app entry (spec 2). Mounts the shell in app.js behind the TempleOS app contract (mount/unmount, ctx-only I/O). */

import { createApp } from './app.js';

export default {
  id: 'standbattle',
  title: 'STANDBATTLE.EXE',
  icon: '',
  width: 1000,
  height: 620,
  resizable: true,
  fluid: true,

  async mount(root, ctx) {
    const app = await createApp(root, ctx, a => a.go('title'));
    this._app = app;
  },

  unmount() { if (this._app) { this._app.destroy(); this._app = null; } }
};
