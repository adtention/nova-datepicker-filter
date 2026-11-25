/**
 * Mounts the filter's Filter.vue on a plain page, without Nova, so Playwright can
 * drive the real component and the installed @vuepic/vue-datepicker.
 *
 * Query parameters:
 * - mode: 'single' (default) or 'range'
 * - locale: passed to the filter as `locale` (default 'da')
 * - above: pixels of empty space above the filter (default 0)
 * - below: pixels of empty space below the filter (default 2000)
 *
 * Every value the filter emits is written as JSON to #emitted.
 */
import { createApp, h } from 'vue'
import '../../../resources/css/filter.css'
import Filter from '../../../resources/js/components/Filter.vue'

const params = new URLSearchParams(window.location.search)
const mode = params.get('mode') === 'range' ? 'range' : 'single'

const filter = {
  name: 'Arrival',
  uniqueKey: 'arrival',
  mode,
  locale: params.get('locale') ?? 'da',
  currentValue: mode === 'range' ? [null, null] : null,
}

const listeners = {}

window.Nova = {
  $on(event, callback) {
    ;(listeners[event] ??= []).push(callback)
  },
  $off(event, callback) {
    listeners[event] = (listeners[event] ?? []).filter(listener => listener !== callback)
  },
}

const FilterContainer = {
  render() {
    return h('div', { class: 'filter-container' }, [
      h('div', { class: 'filter-title' }, this.$slots.default?.()),
      h('div', { class: 'filter-body' }, this.$slots.filter?.()),
    ])
  },
}

document.getElementById('space-above').style.height = `${Number(params.get('above') ?? 0)}px`
document.getElementById('space-below').style.height = `${Number(params.get('below') ?? 2000)}px`

const emitted = document.getElementById('emitted')

const app = createApp({
  render: () =>
    h(Filter, {
      resourceName: 'bookings',
      filterKey: 'arrival',
      onChange: ({ value }) => {
        emitted.textContent = JSON.stringify(value)
      },
    }),
})

app.component('FilterContainer', FilterContainer)
app.config.globalProperties.__ = key => key
app.config.globalProperties.$store = {
  getters: {
    'bookings/getFilter': () => filter,
  },
}

app.mount('#filter')
