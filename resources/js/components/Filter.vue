<template>
  <FilterContainer>
    <span v-if="isSingleMode">{{ filter.name }}</span>

    <template #filter>
      <label v-if="isSingleMode" class="block mt-1">
        <VueDatePicker
          v-model="singleValue"
          class="w-full nova-datepicker-field"
          ref="singlePicker"
          :teleport="true"
          :floating="menuPositions.single.floating"
          :ui="{ menu: menuPositions.single.menuClass }"
          @open="lockMenuSide('single')"
          @closed="releaseMenuSide('single')"
          :locale="dateFnsLocale"
          :time-config="timeConfiguration"
          :auto-apply="true"
          :text-input="textInputConfiguration"
          :formats="formats"
          :placeholder="singlePlaceholder"
          :input-attrs="{ dusk: `${filter.uniqueKey}-single` }"
        />
      </label>

      <template v-else>
        <label class="block">
          <span class="uppercase text-xs font-bold tracking-wide">
            {{ `${filter.name} - ${__('From')}` }}
          </span>

          <VueDatePicker
            v-model="startValue"
            class="w-full mt-1 nova-datepicker-field"
            ref="startPicker"
            :teleport="true"
            :floating="menuPositions.start.floating"
            :ui="{ menu: menuPositions.start.menuClass }"
            @open="lockMenuSide('start')"
            @closed="releaseMenuSide('start')"
            :locale="dateFnsLocale"
            :time-config="timeConfiguration"
            :auto-apply="true"
            :text-input="textInputConfiguration"
            :formats="formats"
            :placeholder="startPlaceholder"
            :input-attrs="{ dusk: `${filter.uniqueKey}-range-start` }"
          />
        </label>

        <label class="block mt-2">
          <span class="uppercase text-xs font-bold tracking-wide">
            {{ `${filter.name} - ${__('To')}` }}
          </span>

          <VueDatePicker
            v-model="endValue"
            class="w-full mt-1 nova-datepicker-field"
            ref="endPicker"
            :teleport="true"
            :floating="menuPositions.end.floating"
            :ui="{ menu: menuPositions.end.menuClass }"
            @open="lockMenuSide('end')"
            @closed="releaseMenuSide('end')"
            :locale="dateFnsLocale"
            :time-config="timeConfiguration"
            :auto-apply="true"
            :text-input="textInputConfiguration"
            :formats="formats"
            :placeholder="endPlaceholder"
            :input-attrs="{ dusk: `${filter.uniqueKey}-range-end` }"
          />
        </label>
      </template>
    </template>
  </FilterContainer>
</template>

<script>
import debounce from 'lodash/debounce'
import { VueDatePicker } from '@vuepic/vue-datepicker'
import { resolveDateFnsLocale } from '../dateFnsLocale'
import {
  normalizeDateFilterValue,
  parseFlexibleDateInput,
  parseIsoDate,
  resolveLocale,
} from '../dateParsing'
import { markRaw } from 'vue'
import {
  createFlipOptions,
  lockMenuToSide,
  sideOfOpenMenu,
  unlockMenuSide,
  waitForMenuPosition,
} from '../menuSide'

/** Gives each picker's teleported menu its own class, so lockMenuSide can find it in <body>. */
let menuCount = 0

/**
 * vue-datepicker reads `floating` once and floating-ui keeps the flip object by reference;
 * lockMenuSide changes it in place (see menuSide.js). markRaw keeps Vue out of it.
 *
 * @returns {{ menuClass: string, floating: { flip: object } }}
 */
function createMenuPosition() {
  return markRaw({
    menuClass: `nova-datepicker-menu-${++menuCount}`,
    floating: { flip: createFlipOptions() },
  })
}

export default {
  components: {
    VueDatePicker,
  },

  emits: ['change'],

  props: {
    resourceName: {
      type: String,
      required: true,
    },
    filterKey: {
      type: String,
      required: true,
    },
    lens: {
      type: String,
      default: '',
    },
  },

  data: () => ({
    menuPositions: {
      single: createMenuPosition(),
      start: createMenuPosition(),
      end: createMenuPosition(),
    },
    singleValue: null,
    startValue: null,
    endValue: null,
    debouncedEventEmitter: null,
    timeConfiguration: {
      enableTimePicker: false,
    },
    formats: {
      input: 'yyyy-MM-dd',
    },
  }),

  created() {
    this.debouncedEventEmitter = debounce(() => this.emitFilterChange(), 500)
    this.setCurrentFilterValue()
  },

  mounted() {
    Nova.$on('filter-reset', this.handleFilterReset)
    Nova.$on('clear-filter-values', this.handleFilterReset)
  },

  beforeUnmount() {
    Nova.$off('filter-reset', this.handleFilterReset)
    Nova.$off('clear-filter-values', this.handleFilterReset)

    if (this.debouncedEventEmitter !== null) {
      this.debouncedEventEmitter.cancel()
    }
  },

  watch: {
    singleValue() {
      if (this.isSingleMode) {
        this.debouncedEventEmitter()
      }
    },

    startValue() {
      if (this.isRangeMode) {
        this.debouncedEventEmitter()
      }
    },

    endValue() {
      if (this.isRangeMode) {
        this.debouncedEventEmitter()
      }
    },
  },

  methods: {
    /**
     * @param {'single'|'start'|'end'} pickerKey
     */
    async lockMenuSide(pickerKey) {
      await waitForMenuPosition()

      const menuPosition = this.menuPositions[pickerKey]
      const menuElement = document.querySelector(`.${menuPosition.menuClass}`)
      const side = sideOfOpenMenu(menuElement, this.$refs[`${pickerKey}Picker`]?.$el)

      // The menu may have closed while we waited.
      if (side === null) {
        return
      }

      lockMenuToSide(menuPosition.floating.flip, side)
    },

    /**
     * @param {'single'|'start'|'end'} pickerKey
     */
    releaseMenuSide(pickerKey) {
      unlockMenuSide(this.menuPositions[pickerKey].floating.flip)
    },

    setCurrentFilterValue() {
      const currentValue = this.filter.currentValue

      if (this.isSingleMode) {
        this.singleValue = this.parseDateValue(
          Array.isArray(currentValue) ? currentValue[0] : currentValue
        )
        this.startValue = null
        this.endValue = null

        return
      }

      const [startValue, endValue] = Array.isArray(currentValue)
        ? currentValue
        : [null, null]

      this.startValue = this.parseDateValue(startValue)
      this.endValue = this.parseDateValue(endValue)
      this.singleValue = null
    },

    emitFilterChange() {
      const value = this.isSingleMode
        ? normalizeDateFilterValue(this.singleValue)
        : [
            normalizeDateFilterValue(this.startValue),
            normalizeDateFilterValue(this.endValue),
          ]

      this.$emit('change', {
        filterClass: this.filterKey,
        value,
      })
    },

    handleFilterReset() {
      this.singleValue = null
      this.startValue = null
      this.endValue = null

      this.setCurrentFilterValue()
    },

    parseDateValue(value) {
      if (value instanceof Date) {
        return Number.isNaN(value.getTime()) ? null : value
      }

      return parseIsoDate(value)
    },
  },

  computed: {
    filter() {
      return this.$store.getters[`${this.resourceName}/getFilter`](this.filterKey)
    },

    mode() {
      return this.filter.mode === 'single' ? 'single' : 'range'
    },

    isSingleMode() {
      return this.mode === 'single'
    },

    isRangeMode() {
      return this.mode === 'range'
    },

    dateFnsLocale() {
      return resolveDateFnsLocale(resolveLocale(this.filter))
    },

    textInputConfiguration() {
      return {
        enterSubmit: true,
        tabSubmit: true,
        openMenu: 'open',
        format: value => parseFlexibleDateInput(value, resolveLocale(this.filter)),
        selectOnFocus: true,
        applyOnBlur: true,
      }
    },

    singlePlaceholder() {
      return this.filter.placeholder || this.__('Choose date')
    },

    startPlaceholder() {
      return this.filter.startPlaceholder || this.__('Start')
    },

    endPlaceholder() {
      return this.filter.endPlaceholder || this.__('End')
    },
  },
}
</script>
