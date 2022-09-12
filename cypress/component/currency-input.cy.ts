import { MaskSymbol, useCurrencyInput, UseCurrencyInputProps } from '@/utils/composable.currency-input'
import BigNumber from 'bignumber.js'

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

describe('useBigNumberInput()', () => {
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

  it('when wrong characters are typed, they are not put into input', () => {
    mountFactory()

    getInput().type('441ffasd012').should('have.value', '441012').blur().should('have.value', '441,012 TST')
  })

  it('when last digit is removed, 0 is set', () => {
    mountFactory({ writableModel: shallowRef(new BigNumber(4)) })

    getInput().focus().should('have.value', '4').type('{moveToEnd}{backspace}').should('have.value', '0')
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
})
