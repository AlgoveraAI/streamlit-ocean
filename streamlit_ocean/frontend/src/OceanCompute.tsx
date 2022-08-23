

import {
    Streamlit,
    StreamlitComponentBase,
    withStreamlitConnection,
} from "streamlit-component-lib"
import React, { ReactNode } from "react"

import Web3  from "web3"

import { 
  ProviderInstance,
  ConfigHelper
 } from "@oceanprotocol/lib"
  
interface State {
    computeResult: any
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

async function runCompute(dataDid: string, algoDid: string , userAddress: string) {

  const config: any = await getTestConfig(web3)
  console.log("config", config)
  const providerUrl = config.providerUri

  const computeEnvs = await ProviderInstance.getComputeEnvironments(providerUrl)
  const computeEnv = computeEnvs.find((ce) => ce.priceMin === 0)
  console.log("computeEnv", computeEnv)

  // const assets: ComputeAsset[] = [
  //   {
  //     documentId: resolvedDdoWith1mTimeout.id,
  //     serviceId: resolvedDdoWith1mTimeout.services[0].id
  //   }
  // ]
  // const dtAddressArray = [resolvedDdoWith1mTimeout.services[0].datatokenAddress]
  // const algo: ComputeAlgorithm = {
  //   documentId: resolvedAlgoDdoWith1mTimeout.id,
  //   serviceId: resolvedAlgoDdoWith1mTimeout.services[0].id
  // }

  // providerInitializeComputeResults = await ProviderInstance.initializeCompute(
  //   assets,
  //   algo,
  //   computeEnv.id,
  //   computeValidUntil,
  //   providerUrl,
  //   consumerAccount
  // )
  // assert(
  //   !('error' in providerInitializeComputeResults.algorithm),
  //   'Cannot order algorithm'
  // )
  // algo.transferTxId = await handleOrder(
  //   providerInitializeComputeResults.algorithm,
  //   resolvedAlgoDdoWith1mTimeout.services[0].datatokenAddress,
  //   consumerAccount,
  //   computeEnv.consumerAddress,
  //   0
  // )
  // for (let i = 0; i < providerInitializeComputeResults.datasets.length; i++) {
  //   assets[i].transferTxId = await handleOrder(
  //     providerInitializeComputeResults.datasets[i],
  //     dtAddressArray[i],
  //     consumerAccount,
  //     computeEnv.consumerAddress,
  //     0
  //   )
  // }
  // const computeJobs = await ProviderInstance.computeStart(
  //   providerUrl,
  //   web3,
  //   consumerAccount,
  //   computeEnv.id,
  //   assets[0],
  //   algo
  // )
  // freeEnvDatasetTxId = assets[0].transferTxId
  // freeEnvAlgoTxId = algo.transferTxId
  // assert(computeJobs, 'Cannot start compute job')
  // computeJobId = computeJobs[0].jobId
}
    
  /**
   * This is a React-based component template. The `render()` function is called
   * automatically when your component should be re-rendered.
   */
class RunCompute extends StreamlitComponentBase<State> {
  public state = { computeResult: "No compute result", isFocused: false }

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
            Run Compute
          </button>
        </span>
      )
    }
  
    /** Click handler for our "Click Me!" button. */
    private onClicked = async (): Promise<void> => {
      const transaction: any = await runCompute(this.props.args["data_did"], this.props.args["data_did"], this.props.args["user_address"])
      this.setState(
        () => ({ computeResult: transaction }),
        () => Streamlit.setComponentValue(this.state.computeResult)
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
export default withStreamlitConnection(RunCompute)
  