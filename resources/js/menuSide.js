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
 * update. So each picker gets its own options object, created once:
 *
 * 1. The menu opens with normal flip behavior, so floating-ui picks the side with room.
 * 2. Once it is positioned, we read which side it landed on and give the other side
 *    a padding no screen can fit. Flip then always prefers the chosen side, and when
 *    neither side fits, its "best fit" fallback also picks the chosen side.
 * 3. When the menu closes, the padding is removed for the next opening.
 *
 * `shift` is left alone, so the menu still moves sideways to stay inside narrow screens.
 *
 * The same file lives in adtention/nova-datepicker-field; keep both copies in step.
 */

/** Padding in pixels that makes floating-ui treat a side as having no room. */
const NO_ROOM = 1000000

/**
 * Creates the flip options object for one picker. Pass it as `floating.flip` and keep
 * the same object for the picker's lifetime; lockMenuToSide and unlockMenuSide change it
 * in place.
 *
 * @returns {{ padding: number|{ top?: number, bottom?: number } }}
 */
export function createFlipOptions() {
  return { padding: 0 }
}

/**
 * @param {{ padding: number|object }} flipOptions The object from createFlipOptions.
 * @param {'top'|'bottom'} side
 */
export function lockMenuToSide(flipOptions, side) {
  if (side === 'top') {
    flipOptions.padding = { bottom: NO_ROOM }

    return
  }

  flipOptions.padding = { top: NO_ROOM }
}

/**
 * @param {{ padding: number|object }} flipOptions The object from createFlipOptions.
 */
export function unlockMenuSide(flipOptions) {
  flipOptions.padding = 0
}

/**
 * Reads which side of the input the open menu was placed on. Compares vertical
 * centers, because the menu's opening animation moves it a few pixels at first.
 *
 * @param {Element|null} menuElement
 * @param {Element|null} inputElement
 * @returns {'top'|'bottom'|null} null when either element is missing.
 */
export function sideOfOpenMenu(menuElement, inputElement) {
  if (!menuElement || !inputElement) {
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
export function waitForMenuPosition() {
  return new Promise(resolve => {
    requestAnimationFrame(() => requestAnimationFrame(() => resolve()))
  })
}
