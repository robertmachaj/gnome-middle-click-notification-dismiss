/* extension.js
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 2 of the License, or
 * (at your option) any later version.
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License
 * along with this program.  If not, see <http://www.gnu.org/licenses/>.
 *
 * SPDX-License-Identifier: GPL-2.0-or-later
 */

/* exported init */

var messageTray = imports.ui.messageTray;
var messageList = imports.ui.messageList;

var injections = {};

function injectToFunction(parent, name, func) {
	let origin = parent[name];
	parent[name] = function () {
		let ret;
		ret = origin.apply(this, arguments);
		if (ret === undefined)
			ret = func.apply(this, arguments);
		return ret;
	}
	return origin;
}

function removeInjection(object, injection, name) {
	if (injection[name] === undefined)
		delete object[name];
	else
		object[name] = injection[name];
}

class Extension {
	constructor() { }

	enable() {
		// Middle click notification popups to close
		injections['messageTray'] = injectToFunction(messageTray.MessageTray.prototype, '_showNotification', function (_source, notification) {
			this._bannerBin.connect('button-press-event', (actor, event) => {
				if (event.get_button() === 2) {
					this._banner.emit('done-displaying');
					this._notification?.destroy();
				}
			});
		});

		// Middle click notifications in the notification drawer
		injections['messageList'] = injectToFunction(messageList.MessageListSection.prototype, 'addMessageAtIndex', function (message, index, animate) {
			message.connect('button-press-event', (actor, event) => {
				if (event.get_button() === 2 && message.canClose()) {
					this.removeMessage(message, animate);
					message.notification?.destroy();
				}
			});
		});
	}

	disable() {
		removeInjection(messageTray.MessageTray.prototype, injections, 'messageTray');
		removeInjection(messageList.MessageListSection.prototype, injections, 'messageList');
	}
}

function init() {
	return new Extension();
}
