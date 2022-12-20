/* eslint-disable max-nested-callbacks */
import { MaskSymbol, UseCurrencyInputProps, useCurrencyInput } from '@/utils/composable.currency-input'
import CurrencyInput from '@/components/common/CurrencyInput.vue'
import BigNumber from 'bignumber.js'

describe('useCurrencyInput()', () => {
  function mountFactory(props?: Partial<UseCurrencyInputProps>) {
    return cy.mount({
      setup() {
        const writableModel = props?.writableModel ?? shallowRef(new BigNumber(0))
        const actual = computed(() => writableModel.value.toFixed())

        const { inputRef } = useCurrencyInput({
          writableModel,
          symbol: props?.symbol ?? { str: 'TST', position: 'right' },
          decimals: props?.decimals ?? 18,
        })

        return {
          inputRef,
          actual,
        }
      },
      template: `
        <div class="p-4 space-y-2">
          <input
            ref="inputRef"
            class="border-2 rounded p-2"
          >
  
          <p>
            Actual: {{ actual }}
          </p>
        </div>
      `,
    })
  }

  const actualShouldBe = (strBigNumber: string) => cy.contains(`Actual: ${strBigNumber}`)

  const getInput = () => cy.get('input')

  it('playground', () => {
    mountFactory()
  })

  it('when 4444 is typed, it is formatted as "4,444 TST"', () => {
    mountFactory()

    getInput()
      .should('have.value', '0 TST')
      .focus()
      .should('have.value', '0')
      .type('4444')
      .should('have.value', '4444')
      .blur()
      .should('have.value', '4,444 TST')

    actualShouldBe('4444')
  })

  it('when period is typed after 0, input value is "0."', () => {
    mountFactory()

    getInput().focus().should('have.value', '0').type('.').should('have.value', '0.')
  })

  it('when value is typed, but symbol position is left, then it should be "TST 4,444"', () => {
    mountFactory({ symbol: { position: 'left', str: 'TST' } })

    getInput()
      .should('have.value', 'TST 0')
      .type('4444')
      .should('have.value', '4444')
      .blur()
      .should('have.value', 'TST 4,444')

    actualShouldBe('4444')
  })

  it('it is not possible to put period twice', () => {
    mountFactory()

    getInput().type('4123..').should('have.value', '4123.')
    actualShouldBe('4123')
  })

  it('when "10.1" typed and then last character deleted, period remains', () => {
    mountFactory()

    getInput().type('10.1{backspace}').should('have.value', '10.')
  })

  it('when wrong characters are typed, they are not put into input', () => {
    mountFactory()

    getInput().type('441ffasd012').should('have.value', '441012').blur().should('have.value', '441,012 TST')
  })

  it('when last digit is removed, 0 is set and cursor is in the end', () => {
    mountFactory({ writableModel: shallowRef(new BigNumber(4)) })

    getInput()
      .focus()
      .should('have.value', '4')
      .type('{moveToEnd}{backspace}')
      .should('have.value', '0')
      // check that cursor not in the start, but in the end
      .type('1')
      .should('have.value', '1') // "10" if cursor is at start
  })

  it('when input with some number is focused and incorrect character is typed, value does not change anyhow', () => {
    mountFactory({ writableModel: shallowRef(new BigNumber(5000012)) })

    getInput().type(',').should('have.value', '5000012')
  })

  it('format is correct: $1,890', () => {
    mountFactory({ symbol: { str: '$', position: 'left', delimiter: '' } })

    getInput().should('have.value', '$0').type('1890').blur().should('have.value', '$1,890')
    actualShouldBe('1890')
  })

  it('symbol is reactive', () => {
    const symbol = ref<MaskSymbol>({ str: '$', position: 'left', delimiter: '' })

    mountFactory({ symbol, writableModel: shallowRef(new BigNumber(9876)) })

    getInput()
      .should('have.value', '$9,876')
      .then(() => {
        symbol.value = { str: 'DEX', position: 'right', delimiter: ' ~ ' }
      })

    getInput().should('have.value', '9,876 ~ DEX')
  })

  it('when model is updated outside of input while it is not focused, input value is updated', () => {
    const model = shallowRef(new BigNumber(1000))

    mountFactory({ writableModel: model })

    getInput()
      .should('have.value', '1,000 TST')
      .then(() => {
        model.value = new BigNumber(533)
      })

    getInput().should('have.value', '533 TST')
  })

  it('when model is updated outside of input while it is focused, input value is updated', () => {
    const model = shallowRef(new BigNumber(1000))

    mountFactory({ writableModel: model })

    getInput()
      .focus()
      .should('have.value', '1000')
      .then(() => {
        model.value = new BigNumber(533)
      })

    getInput().should('have.value', '533')
  })

  it('when value has a lot of decimals, it is formatted as expected', () => {
    mountFactory()

    const NUMBER = '0.' + '0'.repeat(17) + '1'

    getInput()
      .type(NUMBER)
      .blur()
      .should('have.value', NUMBER + ' TST')
  })

  describe('Decimals', () => {
    it('when decimal is set to 5, it is impossible to exceed it', () => {
      mountFactory({ decimals: 5 })

      getInput().type('10.111119009').should('have.value', '10.11111').blur().should('have.value', '10.11111 TST')
      actualShouldBe('10.11111')
    })

    it('when initial model value decimals are greater than props.decimals, model is updated', () => {
      mountFactory({ writableModel: shallowRef(new BigNumber(0.111_222_333)), decimals: 5 })

      getInput().should('have.value', '0.11122 TST')
      actualShouldBe('0.11122')
    })

    it(
      'when decimals are updated to a smaller value and input is focused and its ' +
        'decimals are greater than new value, the input value is updated',
      () => {
        const decimals = ref(5)
        mountFactory({ decimals, writableModel: shallowRef(new BigNumber(1.12)) })

        getInput().type('345')
        actualShouldBe('1.12345').then(() => {
          decimals.value = 2
        })
        getInput().should('have.value', '1.12')
        actualShouldBe('1.12')
      },
    )

    it('when decimals are updated and input is not focused, formatted value is updated', () => {
      const decimals = ref(5)
      mountFactory({ decimals, writableModel: shallowRef(new BigNumber(1.12345)) })

      getInput()
        .should('have.value', '1.12345 TST')
        .then(() => {
          decimals.value = 2
        })
      getInput().should('have.value', '1.12 TST')
    })

    it(
      'when decimals limit is reached and new decimal digits are inserted in the middle, ' +
        'then last digits are removed and cursor is preserved',
      () => {
        mountFactory({ decimals: 5 })

        getInput()
          .type('0.12345{leftArrow}{leftArrow}8')
          .should('have.value', '0.12384')
          // we want to ensure that "9" will be typed **after** "8", so cursor is preserved
          .type('9')
          .should('have.value', '0.12389')
      },
    )

    it(
      'when model value is updated externally to a value with exceeding decimals, ' +
        'then input value & formatted value are correct',
      () => {
        const model = shallowRef(new BigNumber(5.12))
        mountFactory({ writableModel: model, decimals: 2 })

        getInput()
          .should('have.value', '5.12 TST')
          .then(() => {
            model.value = new BigNumber(5.12333)
          })
          .should('have.value', '5.12 TST')
          .focus()
          .should('have.value', '5.12')
          .then(() => {
            model.value = new BigNumber(5.12333)
          })
          .should('have.value', '5.12')
      },
    )
  })

  it('when there is no symbol, format is ok', () => {
    mountFactory({ symbol: ref(null), writableModel: shallowRef(new BigNumber(1_234_567)) })

    getInput().should('have.value', '1,234,567')
  })
})

describe('<CurrencyInput> component', () => {
  it('"1.007{backspace}" leads to "1.00"', () => {
    cy.mount({
      components: { CurrencyInput },
      setup() {
        const model = shallowRef(new BigNumber(0))

        return { model }
      },
      template: `
        <CurrencyInput v-model="model" :decimals="6" />
      `,
    })

    cy.get('input').type('1.007{backspace}').should('have.value', '1.00')
  })
})
