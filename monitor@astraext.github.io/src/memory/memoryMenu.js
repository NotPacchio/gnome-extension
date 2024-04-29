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
import St from 'gi://St';
import Clutter from 'gi://Clutter';
import { gettext as _ } from 'resource:///org/gnome/shell/extensions/extension.js';
import MenuBase from '../menu.js';
import Grid from '../grid.js';
import Utils from '../utils/utils.js';
import MemoryGraph from './memoryGraph.js';
import MemoryMonitor from './memoryMonitor.js';
import MemoryBars from './memoryBars.js';
import SwapBars from './swapBars.js';
import Config from '../config.js';
export default class MemoryMenu extends MenuBase {
    constructor(sourceActor, arrowAlignment, arrowSide) {
        super(sourceActor, arrowAlignment, { name: 'Memory Menu', arrowSide });
        this.addMenuSection(_('Memory'));
        this.addUsage();
        this.addTopProcesses();
        this.addSwap();
        this.addUtilityButtons('memory');
    }
    addUsage() {
        const defaultStyle = '';
        const hoverButton = new St.Button({
            reactive: true,
            track_hover: true,
            style: defaultStyle,
        });
        const grid = new Grid({ styleClass: 'astra-monitor-menu-subgrid' });
        hoverButton.set_child(grid);
        let label = new St.Label({
            text: _('Total:'),
            style_class: 'astra-monitor-menu-label',
            x_expand: true,
        });
        grid.addToGrid(label);
        this.memoryTotalQty = new St.Label({
            text: '',
            style_class: 'astra-monitor-menu-value',
            style: 'width:4em;',
        });
        grid.addToGrid(this.memoryTotalQty);
        label = new St.Label({
            text: _('Allocated:'),
            style_class: 'astra-monitor-menu-label',
            x_expand: true,
        });
        grid.addToGrid(label);
        this.memoryAllocatedQty = new St.Label({
            text: '',
            style_class: 'astra-monitor-menu-value',
            style: 'width:4em;',
        });
        grid.addToGrid(this.memoryAllocatedQty);
        label = new St.Label({
            text: _('Used:'),
            style_class: 'astra-monitor-menu-label',
            x_expand: true,
        });
        grid.addToGrid(label);
        this.memoryUsedQty = new St.Label({
            text: '',
            style_class: 'astra-monitor-menu-value',
            style: 'width:4em;',
        });
        grid.addToGrid(this.memoryUsedQty);
        label = new St.Label({
            text: _('Free:'),
            style_class: 'astra-monitor-menu-label',
            x_expand: true,
        });
        grid.addToGrid(label);
        this.memoryFreeQty = new St.Label({
            text: '',
            style_class: 'astra-monitor-menu-value',
            style: 'width:4em;',
        });
        grid.addToGrid(this.memoryFreeQty);
        {
            const barGrid = new St.Widget({
                layout_manager: new Clutter.GridLayout({
                    orientation: Clutter.Orientation.VERTICAL,
                }),
                style: 'margin-left:0;',
            });
            this.memoryBar = new MemoryBars({
                numBars: 1,
                width: 200 - 2,
                height: 0.8,
                mini: false,
                layout: 'horizontal',
                x_align: Clutter.ActorAlign.START,
                style: 'margin-left:0.5em;margin-bottom:0;margin-right:0;border:solid 1px #555;',
            });
            barGrid.layout_manager.attach(this.memoryBar, 0, 0, 1, 1);
            this.memoryUsagePercLabel = new St.Label({
                text: '0%',
                style: 'width:2.7em;font-size:0.8em;text-align:right;',
            });
            barGrid.layout_manager.attach(this.memoryUsagePercLabel, 1, 0, 1, 1);
            grid.addToGrid(barGrid, 2);
        }
        this.graph = new MemoryGraph({
            width: 200,
            mini: false,
            breakdownConfig: 'memory-menu-graph-breakdown',
        });
        grid.addToGrid(this.graph, 2);
        this.createUsagePopup(hoverButton);
        hoverButton.connect('enter-event', () => {
            hoverButton.style = defaultStyle + this.selectionStyle;
            if (this.memoryUsagePopup)
                this.memoryUsagePopup.open(true);
        });
        hoverButton.connect('leave-event', () => {
            hoverButton.style = defaultStyle;
            if (this.memoryUsagePopup)
                this.memoryUsagePopup.close(true);
        });
        this.addToMenu(hoverButton, 2);
    }
    createUsagePopup(sourceActor) {
        this.memoryUsagePopup = new MenuBase(sourceActor, 0.05, { numCols: 3 });
        this.memoryUsagePopup.addMenuSection(_('Memory Usage Raw Info'));
        this.memoryUsagePopup.addToMenu(new St.Label({
            text: _('Total'),
            style_class: 'astra-monitor-menu-sub-key',
        }));
        const totalQtyLabel = new St.Label({ text: '', style: 'width:4.5em;text-align:right;' });
        this.memoryUsagePopup.addToMenu(totalQtyLabel);
        this.memoryUsagePopup.totalQtyLabel = totalQtyLabel;
        const totalPercLabel = new St.Label({ text: '', style: 'width:4em;text-align:right;' });
        this.memoryUsagePopup.addToMenu(totalPercLabel);
        this.memoryUsagePopup.totalPercLabel = totalPercLabel;
        this.memoryUsagePopup.addToMenu(new St.Label({
            text: _('Allocated'),
            style_class: 'astra-monitor-menu-sub-key',
        }));
        const allocatedQtyLabel = new St.Label({
            text: '',
            style: 'width:4.5em;text-align:right;',
        });
        this.memoryUsagePopup.addToMenu(allocatedQtyLabel);
        this.memoryUsagePopup.allocatedQtyLabel = allocatedQtyLabel;
        const allocatedPercLabel = new St.Label({ text: '', style: 'width:4em;text-align:right;' });
        this.memoryUsagePopup.addToMenu(allocatedPercLabel);
        this.memoryUsagePopup.allocatedPercLabel = allocatedPercLabel;
        this.memoryUsagePopup.addToMenu(new St.Label({
            text: _('Used'),
            style_class: 'astra-monitor-menu-sub-key',
        }));
        const usedQtyLabel = new St.Label({ text: '', style: 'width:4.5em;text-align:right;' });
        this.memoryUsagePopup.addToMenu(usedQtyLabel);
        this.memoryUsagePopup.usedQtyLabel = usedQtyLabel;
        const usedPercLabel = new St.Label({ text: '', style: 'width:4em;text-align:right;' });
        this.memoryUsagePopup.addToMenu(usedPercLabel);
        this.memoryUsagePopup.usedPercLabel = usedPercLabel;
        this.memoryUsagePopup.addToMenu(new St.Label({
            text: _('Free'),
            style_class: 'astra-monitor-menu-sub-key',
        }));
        const freeQtyLabel = new St.Label({ text: '', style: 'width:4.5em;text-align:right;' });
        this.memoryUsagePopup.addToMenu(freeQtyLabel);
        this.memoryUsagePopup.freeQtyLabel = freeQtyLabel;
        const freePercLabel = new St.Label({ text: '', style: 'width:4em;text-align:right;' });
        this.memoryUsagePopup.addToMenu(freePercLabel);
        this.memoryUsagePopup.freePercLabel = freePercLabel;
        this.memoryUsagePopup.addToMenu(new St.Label({
            text: _('Available'),
            style_class: 'astra-monitor-menu-sub-key',
        }));
        const availableQtyLabel = new St.Label({
            text: '',
            style: 'width:4.5em;text-align:right;',
        });
        this.memoryUsagePopup.addToMenu(availableQtyLabel);
        this.memoryUsagePopup.availableLabel = availableQtyLabel;
        const availablePercLabel = new St.Label({ text: '', style: 'width:4em;text-align:right;' });
        this.memoryUsagePopup.addToMenu(availablePercLabel);
        this.memoryUsagePopup.availablePercLabel = availablePercLabel;
        this.memoryUsagePopup.addToMenu(new St.Label({
            text: _('Allocatable'),
            style_class: 'astra-monitor-menu-sub-key',
        }));
        const allocatableQtyLabel = new St.Label({
            text: '',
            style: 'width:4.5em;text-align:right;',
        });
        this.memoryUsagePopup.addToMenu(allocatableQtyLabel);
        this.memoryUsagePopup.allocatableLabel = allocatableQtyLabel;
        const allocatablePercLabel = new St.Label({
            text: '',
            style: 'width:4em;text-align:right;',
        });
        this.memoryUsagePopup.addToMenu(allocatablePercLabel);
        this.memoryUsagePopup.allocatablePercLabel = allocatablePercLabel;
        this.memoryUsagePopup.addToMenu(new St.Label({
            text: _('Active'),
            style_class: 'astra-monitor-menu-sub-key',
        }));
        const activeQtyLabel = new St.Label({ text: '', style: 'width:4.5em;text-align:right;' });
        this.memoryUsagePopup.addToMenu(activeQtyLabel);
        this.memoryUsagePopup.activeQtyLabel = activeQtyLabel;
        const activePercLabel = new St.Label({ text: '', style: 'width:4em;text-align:right;' });
        this.memoryUsagePopup.addToMenu(activePercLabel);
        this.memoryUsagePopup.activePercLabel = activePercLabel;
        this.memoryUsagePopup.addToMenu(new St.Label({
            text: _('Buffers'),
            style_class: 'astra-monitor-menu-sub-key',
        }));
        const buffersQtyLabel = new St.Label({ text: '', style: 'width:4.5em;text-align:right;' });
        this.memoryUsagePopup.addToMenu(buffersQtyLabel);
        this.memoryUsagePopup.buffersQtyLabel = buffersQtyLabel;
        const buffersPercLabel = new St.Label({ text: '', style: 'width:4em;text-align:right;' });
        this.memoryUsagePopup.addToMenu(buffersPercLabel);
        this.memoryUsagePopup.buffersPercLabel = buffersPercLabel;
        this.memoryUsagePopup.addToMenu(new St.Label({
            text: _('Cached'),
            style_class: 'astra-monitor-menu-sub-key',
        }));
        const cachedQtyLabel = new St.Label({ text: '', style: 'width:4.5em;text-align:right;' });
        this.memoryUsagePopup.addToMenu(cachedQtyLabel);
        this.memoryUsagePopup.cachedQtyLabel = cachedQtyLabel;
        const cachedPercLabel = new St.Label({ text: '', style: 'width:4em;text-align:right;' });
        this.memoryUsagePopup.addToMenu(cachedPercLabel);
        this.memoryUsagePopup.cachedPercLabel = cachedPercLabel;
    }
    addTopProcesses() {
        this.addMenuSection(_('Top processes'));
        const defaultStyle = '';
        const hoverButton = new St.Button({
            reactive: true,
            track_hover: true,
            style: defaultStyle,
        });
        const grid = new Grid({ numCols: 3, styleClass: 'astra-monitor-menu-subgrid' });
        this.topProcesses = [];
        const numProcesses = 5;
        for (let i = 0; i < numProcesses; i++) {
            const label = new St.Label({
                text: '',
                style_class: 'astra-monitor-menu-cmd-name',
                x_expand: true,
            });
            grid.addToGrid(label);
            const usage = new St.Label({
                text: '',
                style_class: 'astra-monitor-menu-cmd-usage',
                style: 'width:4.5em;',
            });
            grid.addToGrid(usage);
            const percentage = new St.Label({
                text: '',
                style_class: 'astra-monitor-menu-cmd-usage',
                style: 'width:4em;',
            });
            grid.addToGrid(percentage);
            this.topProcesses.push({ label, usage, percentage });
        }
        hoverButton.set_child(grid);
        this.createTopProcessesPopup(hoverButton);
        hoverButton.connect('enter-event', () => {
            hoverButton.style = defaultStyle + this.selectionStyle;
            if (this.topProcessesPopup)
                this.topProcessesPopup.open(true);
        });
        hoverButton.connect('leave-event', () => {
            hoverButton.style = defaultStyle;
            if (this.topProcessesPopup)
                this.topProcessesPopup.close(true);
        });
        this.addToMenu(hoverButton, 2);
    }
    createTopProcessesPopup(sourceActor) {
        this.topProcessesPopup = new MenuBase(sourceActor, 0.05);
        this.topProcessesPopup.addMenuSection(_('Top processes'));
        this.topProcessesPopup.processes = new Map();
        const grid = new Grid({ numCols: 3, styleClass: 'astra-monitor-menu-subgrid' });
        for (let i = 0; i < MemoryMonitor.TOP_PROCESSES_LIMIT; i++) {
            const usage = new St.Label({
                text: '',
                style_class: 'astra-monitor-menu-cmd-usage',
                style: 'width:4em;',
                y_expand: true,
                y_align: Clutter.ActorAlign.CENTER,
            });
            grid.addGrid(usage, 0, i * 2, 1, 2);
            const percentage = new St.Label({
                text: '',
                style_class: 'astra-monitor-menu-cmd-usage',
                style: 'width:3.5em;',
                y_expand: true,
                y_align: Clutter.ActorAlign.CENTER,
            });
            grid.addGrid(percentage, 1, i * 2, 1, 2);
            const label = new St.Label({
                text: '',
                style_class: 'astra-monitor-menu-cmd-name-full',
            });
            grid.addGrid(label, 2, i * 2, 1, 1);
            const description = new St.Label({
                text: '',
                style_class: 'astra-monitor-menu-cmd-description',
            });
            grid.addGrid(description, 2, i * 2 + 1, 1, 1);
            this.topProcessesPopup.processes.set(i, { label, usage, percentage, description });
        }
        this.topProcessesPopup.addToMenu(grid, 2);
    }
    addSwap() {
        this.addMenuSection(_('Swap'));
        const defaultStyle = '';
        const hoverButton = new St.Button({
            reactive: true,
            track_hover: true,
            style: defaultStyle,
        });
        const grid = new Grid({ numCols: 2, styleClass: 'astra-monitor-menu-subgrid' });
        const swapGrid = new St.Widget({
            layout_manager: new Clutter.GridLayout({ orientation: Clutter.Orientation.VERTICAL }),
        });
        this.swapBar = new SwapBars({
            numBars: 1,
            width: 200 - 2 - 2,
            height: 0.8,
            mini: false,
            layout: 'horizontal',
            x_align: Clutter.ActorAlign.START,
            style: 'margin-left:0.5em;margin-bottom:0;margin-right:0;border:solid 1px #555;',
        });
        swapGrid.layout_manager.attach(this.swapBar, 0, 0, 1, 1);
        this.swapPercLabel = new St.Label({
            text: '0%',
            style: 'width:2.7em;font-size:0.8em;text-align:right;',
        });
        swapGrid.layout_manager.attach(this.swapPercLabel, 1, 0, 1, 1);
        grid.addToGrid(swapGrid, 2);
        const swapUsedLabel = new St.Label({
            text: _('Used:'),
            style_class: 'astra-monitor-menu-label',
            x_expand: true,
        });
        grid.addToGrid(swapUsedLabel);
        this.swapUsedQty = new St.Label({
            text: '',
            style_class: 'astra-monitor-menu-value',
            style: 'width:4em;',
        });
        grid.addToGrid(this.swapUsedQty);
        const swapTotalLabel = new St.Label({
            text: _('Total:'),
            style_class: 'astra-monitor-menu-label',
            x_expand: true,
        });
        grid.addToGrid(swapTotalLabel);
        this.swapTotalQty = new St.Label({
            text: '',
            style_class: 'astra-monitor-menu-value',
            style: 'width:4em;',
        });
        grid.addToGrid(this.swapTotalQty);
        hoverButton.set_child(grid);
        this.createSwapPopup(hoverButton);
        hoverButton.connect('enter-event', () => {
            hoverButton.style = defaultStyle + this.selectionStyle;
            if (this.memorySwapPopup)
                this.memorySwapPopup.open(true);
        });
        hoverButton.connect('leave-event', () => {
            hoverButton.style = defaultStyle;
            if (this.memorySwapPopup)
                this.memorySwapPopup.close(true);
        });
        this.addToMenu(hoverButton, 2);
    }
    createSwapPopup(sourceActor) {
        this.memorySwapPopup = new MenuBase(sourceActor, 0.05, { numCols: 3 });
        this.memorySwapPopup.addMenuSection(_('Swap Info'));
        this.memorySwapPopup.addToMenu(new St.Label({
            text: _('Total'),
            style_class: 'astra-monitor-menu-sub-key',
        }));
        const totalQtyLabel = new St.Label({ text: '', style: 'width:4.5em;text-align:right;' });
        this.memorySwapPopup.addToMenu(totalQtyLabel);
        this.memorySwapPopup.totalQtyLabel = totalQtyLabel;
        const totalPercLabel = new St.Label({ text: '', style: 'width:4em;text-align:right;' });
        this.memorySwapPopup.addToMenu(totalPercLabel);
        this.memorySwapPopup.totalPercLabel = totalPercLabel;
        this.memorySwapPopup.addToMenu(new St.Label({
            text: _('Used'),
            style_class: 'astra-monitor-menu-sub-key',
        }));
        const usedQtyLabel = new St.Label({ text: '', style: 'width:4.5em;text-align:right;' });
        this.memorySwapPopup.addToMenu(usedQtyLabel);
        this.memorySwapPopup.usedQtyLabel = usedQtyLabel;
        const usedPercLabel = new St.Label({ text: '', style: 'width:4em;text-align:right;' });
        this.memorySwapPopup.addToMenu(usedPercLabel);
        this.memorySwapPopup.usedPercLabel = usedPercLabel;
        this.memorySwapPopup.addToMenu(new St.Label({
            text: _('Free'),
            style_class: 'astra-monitor-menu-sub-key',
        }));
        const freeQtyLabel = new St.Label({ text: '', style: 'width:4.5em;text-align:right;' });
        this.memorySwapPopup.addToMenu(freeQtyLabel);
        this.memorySwapPopup.freeQtyLabel = freeQtyLabel;
        const freePercLabel = new St.Label({ text: '', style: 'width:4em;text-align:right;' });
        this.memorySwapPopup.addToMenu(freePercLabel);
        this.memorySwapPopup.freePercLabel = freePercLabel;
        this.memorySwapPopup.addToMenu(new St.Label({
            text: _('Cached'),
            style_class: 'astra-monitor-menu-sub-key',
        }));
        const cachedQtyLabel = new St.Label({ text: '', style: 'width:4.5em;text-align:right;' });
        this.memorySwapPopup.addToMenu(cachedQtyLabel);
        this.memorySwapPopup.cachedQtyLabel = cachedQtyLabel;
        const cachedPercLabel = new St.Label({ text: '', style: 'width:4em;text-align:right;' });
        this.memorySwapPopup.addToMenu(cachedPercLabel);
        this.memorySwapPopup.cachedPercLabel = cachedPercLabel;
        this.memorySwapPopup.addToMenu(new St.Label({
            text: _('Zswap'),
            style_class: 'astra-monitor-menu-sub-key',
        }));
        const zswapQtyLabel = new St.Label({ text: '', style: 'width:4.5em;text-align:right;' });
        this.memorySwapPopup.addToMenu(zswapQtyLabel);
        this.memorySwapPopup.zswapQtyLabel = zswapQtyLabel;
        const zswapPercLabel = new St.Label({ text: '', style: 'width:4em;text-align:right;' });
        this.memorySwapPopup.addToMenu(zswapPercLabel);
        this.memorySwapPopup.zswapPercLabel = zswapPercLabel;
        this.memorySwapPopup.addToMenu(new St.Label({
            text: _('Zswapped'),
            style_class: 'astra-monitor-menu-sub-key',
        }));
        const zswappedQtyLabel = new St.Label({ text: '', style: 'width:4.5em;text-align:right;' });
        this.memorySwapPopup.addToMenu(zswappedQtyLabel);
        this.memorySwapPopup.zswappedQtyLabel = zswappedQtyLabel;
        const zswappedPercLabel = new St.Label({ text: '', style: 'width:4em;text-align:right;' });
        this.memorySwapPopup.addToMenu(zswappedPercLabel);
        this.memorySwapPopup.zswappedPercLabel = zswappedPercLabel;
        const devicesTitle = this.memorySwapPopup.addMenuSection(_('Swap Devices'));
        this.memorySwapPopup.devicesTitle = devicesTitle;
        const devicesGrid = new Grid({
            numCols: 1,
            styleClass: 'astra-monitor-menu-subgrid',
            x_expand: true,
        });
        this.memorySwapPopup.devicesGrid = devicesGrid;
        this.memorySwapPopup.devices = '';
        this.memorySwapPopup.addToMenu(devicesGrid, 3);
    }
    async onOpen() {
        this.clear();
        this.update('memoryUsage');
        Utils.memoryMonitor.listen(this, 'memoryUsage', this.update.bind(this, 'memoryUsage'));
        this.update('graph');
        Utils.memoryMonitor.listen(this.graph, 'memoryUsage', this.update.bind(this, 'graph'));
        Utils.memoryMonitor.listen(this, 'topProcesses', this.update.bind(this, 'topProcesses'));
        Utils.memoryMonitor.requestUpdate('topProcesses');
        Utils.memoryMonitor.listen(this, 'swapUsage', this.update.bind(this, 'swapUsage'));
        Utils.memoryMonitor.requestUpdate('swapUsage');
    }
    async onClose() {
        Utils.memoryMonitor.unlisten(this, 'memoryUsage');
        Utils.memoryMonitor.unlisten(this.graph, 'memoryUsage');
        Utils.memoryMonitor.unlisten(this, 'topProcesses');
        Utils.memoryMonitor.unlisten(this, 'swapUsage');
    }
    clear() {
        this.memoryTotalQty.text = '';
        this.memoryUsedQty.text = '';
        this.memoryAllocatedQty.text = '';
        this.memoryFreeQty.text = '';
        for (let i = 0; i < this.topProcesses.length; i++) {
            this.topProcesses[i].label.text = '';
            this.topProcesses[i].percentage.text = '';
        }
        for (let i = 0; i < MemoryMonitor.TOP_PROCESSES_LIMIT; i++) {
            const popup = this.topProcessesPopup?.processes?.get(i);
            if (!popup)
                continue;
            popup.label.text = '';
            popup.percentage.text = '';
            popup.description.text = '';
        }
    }
    update(code) {
        if (code === 'memoryUsage') {
            const unit = Config.get_string('memory-unit');
            const memoryUsage = Utils.memoryMonitor.getCurrentValue('memoryUsage');
            if (memoryUsage && memoryUsage.total && !isNaN(memoryUsage.total)) {
                this.memoryBar.setUsage([memoryUsage]);
                this.memoryTotalQty.text = Utils.formatBytes(memoryUsage.total, unit, 3);
                this.memoryUsagePercLabel.text =
                    Math.round((memoryUsage.used / memoryUsage.total) * 100.0) + '%';
                if (memoryUsage.used && !isNaN(memoryUsage.used))
                    this.memoryUsedQty.text = Utils.formatBytes(memoryUsage.used, unit, 3);
                if (memoryUsage.allocated && !isNaN(memoryUsage.allocated))
                    this.memoryAllocatedQty.text = Utils.formatBytes(memoryUsage.allocated, unit, 3);
                if (memoryUsage.free && !isNaN(memoryUsage.free))
                    this.memoryFreeQty.text = Utils.formatBytes(memoryUsage.free, unit, 3);
                if (this.memoryUsagePopup) {
                    this.memoryUsagePopup.totalQtyLabel.text = Utils.formatBytes(memoryUsage.total, unit, 3);
                    if (memoryUsage.allocated && !isNaN(memoryUsage.allocated)) {
                        this.memoryUsagePopup.allocatedQtyLabel.text = Utils.formatBytes(memoryUsage.allocated, unit, 3);
                        this.memoryUsagePopup.allocatedPercLabel.text =
                            ((memoryUsage.allocated / memoryUsage.total) * 100).toFixed(1) + '%';
                    }
                    if (memoryUsage.used && !isNaN(memoryUsage.used)) {
                        this.memoryUsagePopup.usedQtyLabel.text = Utils.formatBytes(memoryUsage.used, unit, 3);
                        this.memoryUsagePopup.usedPercLabel.text =
                            ((memoryUsage.used / memoryUsage.total) * 100).toFixed(1) + '%';
                    }
                    if (memoryUsage.free && !isNaN(memoryUsage.free)) {
                        this.memoryUsagePopup.freeQtyLabel.text = Utils.formatBytes(memoryUsage.free, unit, 3);
                        this.memoryUsagePopup.freePercLabel.text =
                            ((memoryUsage.free / memoryUsage.total) * 100).toFixed(1) + '%';
                    }
                    if (memoryUsage.available && !isNaN(memoryUsage.available)) {
                        this.memoryUsagePopup.availableLabel.text = Utils.formatBytes(memoryUsage.available, unit, 3);
                        this.memoryUsagePopup.availablePercLabel.text =
                            ((memoryUsage.available / memoryUsage.total) * 100).toFixed(1) + '%';
                    }
                    if (memoryUsage.allocatable && !isNaN(memoryUsage.allocatable)) {
                        this.memoryUsagePopup.allocatableLabel.text = Utils.formatBytes(memoryUsage.allocatable, unit, 3);
                        this.memoryUsagePopup.allocatablePercLabel.text =
                            ((memoryUsage.allocatable / memoryUsage.total) * 100).toFixed(1) + '%';
                    }
                    if (memoryUsage.active && !isNaN(memoryUsage.active)) {
                        this.memoryUsagePopup.activeQtyLabel.text = Utils.formatBytes(memoryUsage.active, unit, 3);
                        this.memoryUsagePopup.activePercLabel.text =
                            ((memoryUsage.active / memoryUsage.total) * 100).toFixed(1) + '%';
                    }
                    if (memoryUsage.buffers && !isNaN(memoryUsage.buffers)) {
                        this.memoryUsagePopup.buffersQtyLabel.text = Utils.formatBytes(memoryUsage.buffers, unit, 3);
                        this.memoryUsagePopup.buffersPercLabel.text =
                            ((memoryUsage.buffers / memoryUsage.total) * 100).toFixed(1) + '%';
                    }
                    if (memoryUsage.cached && !isNaN(memoryUsage.cached)) {
                        this.memoryUsagePopup.cachedQtyLabel.text = Utils.formatBytes(memoryUsage.cached, unit, 3);
                        this.memoryUsagePopup.cachedPercLabel.text =
                            ((memoryUsage.cached / memoryUsage.total) * 100).toFixed(1) + '%';
                    }
                }
            }
            else {
                this.memoryBar.setUsage([]);
                this.memoryTotalQty.text = '';
                this.memoryUsedQty.text = '';
                this.memoryAllocatedQty.text = '';
            }
            return;
        }
        if (code === 'graph') {
            const usage = Utils.memoryMonitor.getUsageHistory('memoryUsage');
            this.graph.setUsageHistory(usage);
            return;
        }
        if (code === 'topProcesses') {
            const topProcesses = Utils.memoryMonitor.getCurrentValue('topProcesses');
            if (!topProcesses || !Array.isArray(topProcesses)) {
                for (let i = 0; i < this.topProcesses.length; i++) {
                    const topProcess = this.topProcesses[i];
                    if (topProcess) {
                        topProcess.label.text = '';
                        topProcess.usage.text = '';
                        topProcess.percentage.text = '';
                    }
                    if (this.topProcessesPopup) {
                        const popup = this.topProcessesPopup.processes?.get(i);
                        if (!popup)
                            continue;
                        popup.label.text = '';
                        popup.usage.text = '';
                        popup.description.text = '';
                        popup.percentage.text = '';
                    }
                }
            }
            else {
                const unit = Config.get_string('memory-unit');
                for (let i = 0; i < topProcesses.length; i++) {
                    const topProcess = topProcesses[i];
                    const process = topProcess.process;
                    const usage = topProcess.usage;
                    const percentage = topProcess.percentage;
                    if (this.topProcesses[i]) {
                        this.topProcesses[i].label.text = process.exec;
                        this.topProcesses[i].usage.text = Utils.formatBytes(usage, unit, 3);
                        this.topProcesses[i].percentage.text = percentage.toFixed(1) + '%';
                    }
                    if (this.topProcessesPopup) {
                        const popup = this.topProcessesPopup.processes?.get(i);
                        if (!popup)
                            continue;
                        popup.label.text = process.exec;
                        popup.description.text = process.cmd;
                        popup.usage.text = Utils.formatBytes(usage, unit, 3);
                        popup.percentage.text = percentage.toFixed(1) + '%';
                    }
                }
            }
            return;
        }
        if (code === 'swapUsage') {
            const swapUsage = Utils.memoryMonitor.getCurrentValue('swapUsage');
            if (swapUsage && swapUsage.total && !isNaN(swapUsage.total)) {
                const unit = Config.get_string('memory-unit');
                this.swapBar.setUsage(swapUsage);
                const perc = (swapUsage.used / swapUsage.total) * 100.0;
                if (!isNaN(perc))
                    this.swapPercLabel.text = Math.round(perc) + '%';
                else
                    this.swapPercLabel.text = '0%';
                this.swapTotalQty.text = Utils.formatBytes(swapUsage.total, unit, 3);
                this.swapUsedQty.text = Utils.formatBytes(swapUsage.used, unit, 3);
                if (this.memorySwapPopup) {
                    this.memorySwapPopup.totalQtyLabel.text = Utils.formatBytes(swapUsage.total, unit, 3);
                    if (swapUsage.used && !isNaN(swapUsage.used)) {
                        this.memorySwapPopup.usedQtyLabel.text = Utils.formatBytes(swapUsage.used, unit, 3);
                        this.memorySwapPopup.usedPercLabel.text =
                            ((swapUsage.used / swapUsage.total) * 100).toFixed(1) + '%';
                    }
                    else {
                        this.memorySwapPopup.usedQtyLabel.text = '-';
                        this.memorySwapPopup.usedPercLabel.text = '';
                    }
                    if (swapUsage.free && !isNaN(swapUsage.free)) {
                        this.memorySwapPopup.freeQtyLabel.text = Utils.formatBytes(swapUsage.free, unit, 3);
                        this.memorySwapPopup.freePercLabel.text =
                            ((swapUsage.free / swapUsage.total) * 100).toFixed(1) + '%';
                    }
                    else {
                        this.memorySwapPopup.freeQtyLabel.text = '-';
                        this.memorySwapPopup.freePercLabel.text = '';
                    }
                    if (swapUsage.cached && !isNaN(swapUsage.cached)) {
                        this.memorySwapPopup.cachedQtyLabel.text = Utils.formatBytes(swapUsage.cached, unit, 3);
                        this.memorySwapPopup.cachedPercLabel.text =
                            ((swapUsage.cached / swapUsage.total) * 100).toFixed(1) + '%';
                    }
                    else {
                        this.memorySwapPopup.cachedQtyLabel.text = '-';
                        this.memorySwapPopup.cachedPercLabel.text = '';
                    }
                    if (swapUsage.zswap && !isNaN(swapUsage.zswap))
                        this.memorySwapPopup.zswapQtyLabel.text = Utils.formatBytes(swapUsage.zswap, unit, 3);
                    else
                        this.memorySwapPopup.zswapQtyLabel.text = '-';
                    if (swapUsage.zswapped && !isNaN(swapUsage.zswapped))
                        this.memorySwapPopup.zswappedQtyLabel.text = Utils.formatBytes(swapUsage.zswapped, unit, 3);
                    else
                        this.memorySwapPopup.zswappedQtyLabel.text = '-';
                    if (swapUsage.devices && Array.isArray(swapUsage.devices)) {
                        const hash = JSON.stringify(swapUsage.devices);
                        if (this.memorySwapPopup.devices !== hash) {
                            const devicesGrid = this.memorySwapPopup.devicesGrid;
                            if (devicesGrid) {
                                devicesGrid.remove_all_children();
                                for (let i = 0; i < swapUsage.devices.length; i++) {
                                    const device = swapUsage.devices[i];
                                    const deviceGrid = new Grid({
                                        numCols: 2,
                                        styleClass: 'astra-monitor-menu-subgrid',
                                        x_expand: true,
                                    });
                                    deviceGrid.addToGrid(new St.Label({
                                        text: device.device,
                                        style_class: 'astra-monitor-menu-label',
                                        x_expand: true,
                                    }), 2);
                                    deviceGrid.addToGrid(new St.Label({
                                        text: Utils.capitalize(device.type),
                                        style_class: 'astra-monitor-menu-unmonitored',
                                        x_expand: true,
                                    }));
                                    deviceGrid.addToGrid(new St.Label({
                                        text: Utils.formatBytes(device.used, unit, 3) +
                                            ' / ' +
                                            Utils.formatBytes(device.size, unit, 3),
                                        style_class: 'astra-monitor-menu-value',
                                        x_expand: true,
                                    }));
                                    devicesGrid.addToGrid(deviceGrid);
                                }
                            }
                        }
                    }
                    else {
                        this.memorySwapPopup.devicesTitle.hide();
                        this.memorySwapPopup.devicesGrid.hide();
                        this.memorySwapPopup.devices = '';
                    }
                }
            }
            else {
                this.swapBar.setUsage(null);
                this.swapTotalQty.text = '';
                this.swapUsedQty.text = '';
                if (this.memorySwapPopup) {
                    this.memorySwapPopup.totalQtyLabel.text = '';
                    this.memorySwapPopup.usedQtyLabel.text = '';
                    this.memorySwapPopup.usedPercLabel.text = '';
                    this.memorySwapPopup.freeQtyLabel.text = '';
                    this.memorySwapPopup.freePercLabel.text = '';
                    this.memorySwapPopup.cachedQtyLabel.text = '';
                    this.memorySwapPopup.cachedPercLabel.text = '';
                    this.memorySwapPopup.zswapQtyLabel.text = '';
                    this.memorySwapPopup.zswappedQtyLabel.text = '';
                }
            }
            return;
        }
    }
    destroy() {
        this.close(true);
        this.removeAll();
        if (this.memoryUsagePopup) {
            this.memoryUsagePopup.destroy();
            this.memoryUsagePopup = null;
        }
        if (this.topProcessesPopup) {
            this.topProcessesPopup.destroy();
            this.topProcessesPopup = null;
        }
        super.destroy();
    }
}
