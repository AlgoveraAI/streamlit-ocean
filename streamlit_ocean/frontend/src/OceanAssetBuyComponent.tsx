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
  configHelperNetworks,
  ConfigHelper,
  Config,
  Datatoken,
  ProviderFees,
  ProviderInstance,
} from '@oceanprotocol/lib'

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
    const config: any = await getTestConfig(web3)
    console.log("config", config)
    const aquarius = new Aquarius(config.metadataCacheUri)
    const providerUrl = config.providerUri
    const datatoken = new Datatoken(web3)
    const DATATOKEN_AMOUNT = '1'
    console.log("userAddress", userAddress[0])
    const consumerETHBalance = await web3.eth.getBalance(userAddress[0])
    console.log(`Consumer ETH balance: ${consumerETHBalance}`)
    let consumerOCEANBalance = await balance(web3, config.oceanTokenAddress, userAddress[0])
    console.log(`Consumer OCEAN balance before swap: ${consumerOCEANBalance}`)
    console.log('Did', did)
    const dt = await aquarius.resolve(did)
    console.log("dt", dt)
    const dtAddress = dt.datatokens[0].address
    console.log("dtAddress", dtAddress)
    // let consumerDTBalance = await web3.eth.getBalance(userAddress[0], )
    let consumerDTBalance = await balance(web3, dtAddress, userAddress[0])
    console.log(`Consumer ${dt.datatokens[0].symbol} balance before swap: ${consumerDTBalance}`)

    // await fixedRate.buyDT(userAddress, freId, '1', '2')

    // consumerOCEANBalance = await balance(web3, addresses.Ocean, userAddress)
    // console.log(`Consumer OCEAN balance after swap: ${consumerOCEANBalance}`)
    // consumerDTBalance = await balance(web3, dtAddress, userAddress)
    // console.log(`Consumer ${FRE_NFT_SYMBOL} balance after swap: ${consumerDTBalance}`)

    // const resolvedDDO = await aquarius.waitForAqua(DDO.id)
    // assert(resolvedDDO, 'Cannot fetch DDO from Aquarius')

    // const initializeData = await ProviderInstance.initialize(
    //   resolvedDDO.id,
    //   resolvedDDO.services[0].id,
    //   0,
    //   userAddress,
    //   providerUrl
    // )

    // const providerFees: ProviderFees = {
    //   providerFeeAddress: initializeData.providerFee.providerFeeAddress,
    //   providerFeeToken: initializeData.providerFee.providerFeeToken,
    //   providerFeeAmount: initializeData.providerFee.providerFeeAmount,
    //   v: initializeData.providerFee.v,
    //   r: initializeData.providerFee.r,
    //   s: initializeData.providerFee.s,
    //   providerData: initializeData.providerFee.providerData,
    //   validUntil: initializeData.providerFee.validUntil
    // }

    // const tx = await datatoken.startOrder(
    //   dtAddress,
    //   userAddress,
    //   userAddress,
    //   0,
    //   providerFees
    // )

    // const downloadURL = await ProviderInstance.getDownloadUrl(
    //   DDO.id,
    //   userAddress,
    //   DDO.services[0].id,
    //   0,
    //   tx.transactionHash,
    //   providerUrl,
    //   web3
    // )

    // console.log(`Download URL: ${downloadURL}`)

    // consumerOCEANBalance = await balance(web3, addresses.Ocean, userAddress)
    // console.log(`Consumer OCEAN balance after order: ${consumerOCEANBalance}`)
    // consumerDTBalance = await balance(web3, dtAddress, userAddress)
    // console.log(`Consumer ${FRE_NFT_SYMBOL} balance after order: ${consumerDTBalance}`)

    // return did
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
  