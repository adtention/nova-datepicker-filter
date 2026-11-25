import { markRaw } from 'vue'

/**
 * Rule: the date menu chooses once, when it opens, whether it sits above or below
 * the input, and stays on that side until it closes.
 *
 * Why: @vuepic/vue-datepicker positions its teleported menu with floating-ui and
 * re-runs the `flip` middleware on every scroll and resize. A field low on the page
 * opens its menu above the input, and as soon as the user scrolls enough for the
 * menu to fit below, it jumps to the other side. Staff reported this as the date
 * picker "jumping around".
 *
 * How: vue-datepicker 12 reads the `floating` prop once, when the picker is set up,
 * so a new placement passed later is ignored. It does pass our `flip` options object
 * to floating-ui by reference, and floating-ui reads that object again on every
 * update. So each picker gets one menu side object (createMenuSide), kept for the
 * picker's lifetime, and we change its flip options in place:
 *
 * 1. On `open` the padding is reset at once. vue-datepicker emits `open` before it
 *    renders the menu, so floating-ui places the new menu with normal flip behavior
 *    and picks the side with room, whatever happened at an earlier opening.
 * 2. Once it is positioned, we read which side it landed on and give the other side
 *    a padding no screen can fit. Flip then always prefers the chosen side, and when
 *    neither side fits, its "best fit" fallback also picks the chosen side.
 * 3. If the menu closed or reopened while we waited, that lock is skipped; the
 *    closing menu is still in the DOM during its leave animation and would give a
 *    side for a menu that is gone.
 *
 * `shift` is left alone, so the menu still moves sideways to stay inside narrow screens.
 *
 * The same file lives in adtention/nova-datepicker-field; keep both copies in step.
 */

/** Padding in pixels that makes floating-ui treat a side as having no room. */
const NO_ROOM = 1000000

/** Numbers each menu, so lockSideAfterOpening can find its teleported menu in <body>. */
let menuCount = 0

/**
 * @typedef {object} MenuSide
 * @property {string} menuClass Class on the teleported menu element.
 * @property {{ menu: string }} ui Pass as the picker's `ui` prop.
 * @property {{ flip: { padding: number|{ top?: number, bottom?: number } } }} floating
 *   Pass as the picker's `floating` prop.
 * @property {boolean} isOpen
 * @property {number} openings Counts openings, so a lock from an earlier opening is skipped.
 */

/**
 * Creates the menu side object for one picker. markRaw keeps Vue from proxying it:
 * floating-ui must keep reading the same flip object we change.
 *
 * @param {string} classPrefix Unique per package, so menus of different packages on
 *   one page never share a class.
 * @returns {MenuSide}
 */
export function createMenuSide(classPrefix) {
  const menuClass = `${classPrefix}-${++menuCount}`

  return markRaw({
    menuClass,
    ui: { menu: menuClass },
    floating: { flip: { padding: 0 } },
    isOpen: false,
    openings: 0,
  })
}

/**
 * Call from the picker's `open` event.
 *
 * @param {MenuSide} menuSide
 * @param {() => Element|null|undefined} findInputElement Returns the picker's root element.
 * @returns {Promise<void>}
 */
export async function lockSideAfterOpening(menuSide, findInputElement) {
  menuSide.floating.flip.padding = 0
  menuSide.isOpen = true

  const opening = ++menuSide.openings

  await waitForMenuPosition()

  if (!menuSide.isOpen) {
    return
  }

  if (opening !== menuSide.openings) {
    return
  }

  const side = sideOfOpenMenu(document.querySelector(`.${menuSide.menuClass}`), findInputElement())

  if (side === null) {
    return
  }

  if (side === 'top') {
    menuSide.floating.flip.padding = { bottom: NO_ROOM }

    return
  }

  menuSide.floating.flip.padding = { top: NO_ROOM }
}

/**
 * Call from the picker's `closed` event.
 *
 * @param {MenuSide} menuSide
 */
export function markMenuClosed(menuSide) {
  menuSide.isOpen = false
}

/**
 * Reads which side of the input the open menu was placed on. Compares vertical
 * centers, because the menu's opening animation moves it a few pixels at first.
 *
 * @param {Element|null} menuElement
 * @param {Element|null|undefined} inputElement
 * @returns {'top'|'bottom'|null} null when either element is missing.
 */
function sideOfOpenMenu(menuElement, inputElement) {
  if (!menuElement) {
    return null
  }

  if (!inputElement) {
    return null
  }

  const menuRect = menuElement.getBoundingClientRect()
  const inputRect = inputElement.getBoundingClientRect()
  const menuCenter = menuRect.top + menuRect.height / 2
  const inputCenter = inputRect.top + inputRect.height / 2

  if (menuCenter < inputCenter) {
    return 'top'
  }

  return 'bottom'
}

/**
 * Resolves after floating-ui has placed a newly opened menu. floating-ui computes the
 * position asynchronously after the menu mounts, so we wait two animation frames
 * instead of reading the position straight away.
 *
 * @returns {Promise<void>}
 */
function waitForMenuPosition() {
  return new Promise(resolve => {
    requestAnimationFrame(() => requestAnimationFrame(() => resolve()))
  })
}
