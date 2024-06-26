//////////////////////////////////////////////////////////////////////////////////////////
//                               ___            _     ___                               //
//                               |   |   \/    | ) |  |                                 //
//                           O-  |-  |   |  -  |   |  |-  -O                            //
//                               |   |_  |     |   |  |_                                //
//                                                                                      //
//////////////////////////////////////////////////////////////////////////////////////////

// SPDX-FileCopyrightText: Simon Schneegans <code@simonschneegans.de>
// SPDX-License-Identifier: MIT

'use strict';

import * as utils from '../utils.js';
import {ItemClass} from '../ItemClass.js';

const _ = await utils.importGettext();

//////////////////////////////////////////////////////////////////////////////////////////
// A menu cannot be activated. It should always contain some children.                  //
// See common/ItemRegistry.js for a description of the action's format.                 //
//////////////////////////////////////////////////////////////////////////////////////////

export function getCustomMenu() {
  return {

    // There are two fundamental item types in Fly-Pie: Actions and Menus. Actions have an
    // onSelect() method which is called when the user selects the item, Menus can have
    // child Actions or Menus.
    class: ItemClass.MENU,

    // This will be shown in the add-new-item-popover of the settings dialog.
    name: _('Custom Menu'),

    // This is also used in the add-new-item-popover.
    icon: 'flypie-symbolic-#46a',

    // Translators: Please keep this short.
    // This is the (short) description shown in the add-new-item-popover.
    subtitle: _('This can contain custom actions and other menus.'),

    // This is the (long) description shown when an item of this type is selected.
    description: _(
        'A <b>Custom Menu</b> can contain any number of actions and submenus. However, for precise item selection, a maximum number of twelve items is recommended.'),

    // This will be called whenever a menu is opened containing an item of this kind.
    createItem: (centered) => {
      return {centered: centered, children: []};
    }
  };
}
