import {
    Streamlit,
    StreamlitComponentBase,
    withStreamlitConnection,
} from "streamlit-component-lib"
import React, { ReactNode } from "react"

import Web3  from "web3"

import {
  Aquarius,
  balance,
  Asset,
  approve,
  configHelperNetworks,
  FixedRateExchange,
  ConfigHelper,
  Config,
  Datatoken,
  ProviderFees,
  ProviderInstance,
  // getFreOrderParams,
  FreCreationParams,
  NftFactory,
  NftCreateData,
  // Erc20CreateParams,
  ZERO_ADDRESS,
  approveWei,
} from '@oceanprotocol/lib'

declare global {
  interface AssetExtended extends Asset {
    accessDetails?: any
  }
}

interface State {
    transaction: string
    isFocused: boolean
}
  
declare global {
    interface Window {
      ethereum: any;
    }
}

const web3 = new Web3(window.ethereum)

const getTestConfig = async (web3: Web3) => {
  const config = new ConfigHelper().getConfig(await web3.eth.getChainId())
  config.providerUri = process.env.PROVIDER_URL || config.providerUri
  return config
}

async function buyAsset(did: string, userAddress: string) {
    const accounts = await window.ethereum.request({
      method: 'eth_requestAccounts',
    });
    console.log("accounts", accounts)

    const config: any = await getTestConfig(web3)
    console.log("config", config)

    const aquarius = new Aquarius(config.metadataCacheUri)
    const providerUrl = config.providerUri
    console.log("userAddress", userAddress[0])

    const consumerETHBalance = await web3.eth.getBalance(userAddress[0])
    console.log(`Consumer ETH balance: ${consumerETHBalance}`)
    let consumerOCEANBalance = await balance(web3, config.oceanTokenAddress, userAddress[0])
    console.log(`Consumer OCEAN balance before swap: ${consumerOCEANBalance}`)

    console.log('Did', did)
    const dt: AssetExtended = await aquarius.resolve(did)
    const resolvedDataDDO = await aquarius.waitForAqua(did);
    console.log("dt", dt)
    console.log("resolvedDataDDO", resolvedDataDDO)
    const dtAddress = dt.datatokens[0].address
    console.log("dtAddress", dtAddress)
    console.log("dt.datatokens[0]" , dt.datatokens[0])

    let consumerDTBalance = await balance(web3, dtAddress, userAddress[0])
    console.log(`Consumer ${dt.datatokens[0].symbol} balance before swap: ${consumerDTBalance}`)
  
    const freAddressRinkeby = config.fixedRateExchangeAddress
    console.log("config freAddressRinkeby", config.fixedRateExchangeAddress)
    const oceanAddressRinkeby = config.oceanTokenAddress

    // const fixedRate = new FixedRateExchange(web3, freAddressRinkeby)
    const fixedRate = new FixedRateExchange(freAddressRinkeby, web3)
    // fixedRate.oceanAddress = oceanAddressRinkeby
    console.log("fixedRate", fixedRate)
    
      const exchangeId = await fixedRate.generateExchangeId(config.oceanTokenAddress, dtAddress) // previously contracts.daiAddress
      console.log("exchangeId", exchangeId)
      const exchangeIds = await fixedRate.getExchanges()
      console.log("All exchangeIds", exchangeIds)
      console.log(exchangeIds.includes(exchangeId))
      if (exchangeIds.includes(exchangeId) == false) {
        return "Error, asset is either not with fixed pricing or not available for purchase"
      }

      // const dtSupply = await fixedRate.getDTSupply(exchangeId)
      const dtSupply = await fixedRate.getDatatokenSupply(exchangeId)
      console.log("dtSupply", dtSupply)
      // const btSupply = await fixedRate.getBTSupply(exchangeId)
      const btSupply = await fixedRate.getBasetokenSupply(exchangeId)
      console.log("btSupply", btSupply)

      // const baseInGivenOutDT = await fixedRate.calcBaseInGivenOutDT(exchangeId, '100')
      const baseInGivenOutDT = await fixedRate.calcBaseInGivenDatatokensOut(exchangeId, '100')
      console.log("baseInGivenOutDT", baseInGivenOutDT)
      // const amountBtOut = await fixedRate.getAmountBTOut(exchangeId, '100')
      const amountBtOut = await fixedRate.getAmountBasetokensOut(exchangeId, '100')
      console.log("amountBtOut", amountBtOut)

      console.log("Awaiting active fre", await fixedRate.isActive(exchangeId))

      // const txApprove = await approve(web3, userAddress[0], oceanAddressRinkeby, fixedRate.fixedRateAddress, '100')
      const txApprove = await approve(web3, config, userAddress[0], oceanAddressRinkeby, fixedRate.address, '100')
      console.log("txApprove", txApprove)

      const tx = await fixedRate.buyDatatokens(userAddress[0], exchangeId, '1', '100')
      console.log("tx", tx)
      return "Success, bought asset"

}
/**
   * This is a React-based component template. The `render()` function is called
   * automatically when your component should be re-rendered.
*/
class BuyAsset extends StreamlitComponentBase<State> {
    public state = { transaction: "No transaction", isFocused: false }
  
    public render = (): ReactNode => {
      // Arguments that are passed to the plugin in Python are accessible
      // via `this.props.args`. Here, we access the "name" arg.
      // Streamlit sends us a theme object via props that we can use to ensure
      // that our component has visuals that match the active theme in a
      // streamlit app.
      const { theme } = this.props
      const style: React.CSSProperties = {}
  
      // Maintain compatibility with older versions of Streamlit that don't send
      // a theme object.
      if (theme) {
        // Use the theme object to style our button border. Alternatively, the
        // theme style is defined in CSS vars.
        const borderStyling = `1px solid ${
          this.state.isFocused ? theme.primaryColor : "gray"
        }`
        style.border = borderStyling
        style.outline = borderStyling
      }
  
      // Show a button and some text.
      // When the button is clicked, we'll increment our "numClicks" state
      // variable, and send its new value back to Streamlit, where it'll
      // be available to the Python program.
      return (
        <span>
          <button
            style={style}
            onClick={this.onClicked}
            disabled={this.props.disabled}
            onFocus={this._onFocus}
            onBlur={this._onBlur}
          >
            Buy Asset
          </button>
        </span>
      )
    }
  
    /** Click handler for our "Click Me!" button. */
    private onClicked = async (): Promise<void> => {
      const transaction: any = await buyAsset(this.props.args["did"], this.props.args["user_address"])
      this.setState(
        () => ({ transaction: transaction }),
        () => Streamlit.setComponentValue(this.state.transaction)
      )
      // Increment state.numClicks, and pass the new value back to
      // Streamlit via `Streamlit.setComponentValue`.
    }
  
    /** Focus handler for our "Click Me!" button. */
    private _onFocus = (): void => {
      this.setState({ isFocused: true })
    }
  
    /** Blur handler for our "Click Me!" button. */
    private _onBlur = (): void => {
      this.setState({ isFocused: false })
    }
  }
  
// "withStreamlitConnection" is a wrapper function. It bootstraps the
// connection between your component and the Streamlit app, and handles
// passing arguments from Python -> Component.
//
// You don't need to edit withStreamlitConnection (but you're welcome to!).
export default withStreamlitConnection(BuyAsset)
  