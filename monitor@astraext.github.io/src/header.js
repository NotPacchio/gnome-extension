/*!
 * Copyright (C) 2023 Lju
 *
 * This file is part of Astra Monitor extension for GNOME Shell.
 * [https://github.com/AstraExt/astra-monitor]
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the
 * GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License
 * along with this program. If not, see <https://www.gnu.org/licenses/>.
 */
import GObject from 'gi://GObject';
import St from 'gi://St';
import Atk from 'gi://Atk';
import Clutter from 'gi://Clutter';
import * as Main from 'resource:///org/gnome/shell/ui/main.js';
import Utils from './utils/utils.js';
import Config from './config.js';
export default GObject.registerClass(class Header extends St.Widget {
    constructor(name) {
        super({
            name: 'AstraMonitorHeader',
            reactive: true,
            can_focus: true,
            track_hover: true,
            style_class: 'panel-button astra-monitor-header',
            accessible_name: name,
            accessible_role: Atk.Role.MENU,
            layoutManager: new Clutter.BinLayout(),
            x_expand: true,
            y_expand: true,
            x_align: Clutter.ActorAlign.START,
            y_align: Clutter.ActorAlign.FILL,
        });
        this.cachedHeight = { fill: -1, override: -1 };
        this.name = name;
        Utils.verbose(`Creating ${this.name}`);
        this.box = new St.BoxLayout({
            name: 'AstraMonitorHeaderBox',
            x_expand: true,
            y_expand: false,
            x_align: Clutter.ActorAlign.START,
            y_align: Clutter.ActorAlign.CENTER,
            style_class: 'astra-monitor-header-box',
        });
        this.add_child(this.box);
        this.createTooltip();
        this.connect('button-press-event', (_widget, _event) => {
            if (this.menu)
                this.menu.toggle();
            return Clutter.EVENT_PROPAGATE;
        });
        this.connect('touch-event', (_widget, _event) => {
            if (this.menu)
                this.menu.toggle();
            return Clutter.EVENT_PROPAGATE;
        });
        this.connect('hide', () => {
            if (this.menu)
                this.menu.close(true);
        });
        this.connect('enter-event', () => {
            this.showTooltip();
        });
        this.connect('leave-event', () => {
            this.hideTooltip();
        });
        Config.connect(this, 'changed::headers-height-override', this.setStyle.bind(this));
        this.box.connect('notify::allocation', () => {
            Utils.lowPriorityTask(this.setStyle.bind(this));
        });
    }
    getMenu() {
        return this.menu;
    }
    setStyle() {
        if (!this.box.get_parent())
            return;
        if (!this.box.has_allocation())
            return;
        let fillHeight = this.box.get_parent().height ?? 0;
        const override = Config.get_int('headers-height-override');
        if (this.cachedHeight.fill === fillHeight && this.cachedHeight.override === override) {
            return;
        }
        this.cachedHeight = { fill: fillHeight, override };
        fillHeight -= 4;
        const scaledFillHeight = Math.min(32, fillHeight) * this.scaleFactor;
        let style = `height:${scaledFillHeight}px;`;
        if (override > 15 && override < 80)
            style = `height:${override}px;`;
        this.box.set_style(style);
    }
    insert_child_above(child, sibling) {
        if (this.box)
            this.box.insert_child_above(child, sibling);
        else
            super.insert_child_above(child, sibling);
    }
    insert_child_at_index(child, index) {
        if (this.box)
            this.box.insert_child_at_index(child, index);
        else
            super.insert_child_at_index(child, index);
    }
    insert_child_below(child, sibling) {
        if (this.box)
            this.box.insert_child_below(child, sibling);
        else
            super.insert_child_below(child, sibling);
    }
    remove_child(child) {
        if (this.box)
            this.box.remove_child(child);
        else
            super.remove_child(child);
    }
    update() {
        Utils.error('update() needs to be overridden');
    }
    setMenu(menu) {
        this.menu = menu;
        this.menu.connect('open-state-changed', this.onOpenMenu.bind(this));
    }
    onOpenMenu(_menu, open) {
        if (open) {
            this.add_style_pseudo_class('active');
            Utils.lowPriorityTask(() => {
                this.menu?.onOpen();
            });
        }
        else {
            this.remove_style_pseudo_class('active');
            Utils.lowPriorityTask(() => {
                this.menu?.onClose();
            });
        }
        const workArea = Main.layoutManager.getWorkAreaForMonitor(Main.layoutManager.primaryIndex);
        const scaleFactor = St.ThemeContext.get_for_stage(global.stage).scale_factor;
        const verticalMargins = this.menu.actor.margin_top + this.menu.actor.margin_bottom;
        const maxHeight = Math.round((workArea.height - verticalMargins) / scaleFactor);
        this.menu.actor.style = `max-height: ${maxHeight}px;`;
    }
    createTooltip() { }
    showTooltip() { }
    hideTooltip() { }
    get scaleFactor() {
        const themeContext = St.ThemeContext.get_for_stage(global.get_stage());
        if (themeContext.get_scale_factor) {
            return themeContext.get_scale_factor();
        }
        return 1;
    }
    destroy() {
        Config.clear(this);
        if (this.menu) {
            this.menu.onClose();
            this.menu.destroy();
        }
        super.destroy();
    }
});
