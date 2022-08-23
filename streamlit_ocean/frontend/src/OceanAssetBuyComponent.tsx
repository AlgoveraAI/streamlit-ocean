import {
    Streamlit,
    StreamlitComponentBase,
    withStreamlitConnection,
} from "streamlit-component-lib"
import React, { ReactNode } from "react"

import Web3  from "web3"

// import { getAccessDetails, getOrderPriceAndFees } from "./market/src/utils/accessDetailsAndPricing"

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
  getFreOrderParams,
  FreCreationParams,
  NftFactory,
  NftCreateData,
  Erc20CreateParams,
  ZERO_ADDRESS,
  approveWei,
} from '@oceanprotocol/lib'

var axios = require('axios');

declare global {
  interface AssetExtended extends Asset {
    accessDetails?: any
  }
}


async function query(datatokenAddress: string) {
  const query = `{
    token(id:"${datatokenAddress}", subgraphError: deny){
      id
      symbol
      nft {
        name
        symbol
        address
      }
      name
      symbol
      cap
      isDatatoken
      holderCount
      orderCount
      orders(skip:0,first:1){
        amount
        serviceIndex
        payer {
          id
        }
        consumer{
          id
        }
        estimatedUSDValue
        lastPriceToken
        lastPriceValue
      }
    }
    fixedRateExchanges(subgraphError:deny){
      id
      price
      active
    }
  }`
  
  const baseUrl = "https://v4.subgraph.rinkeby.oceanprotocol.com"
  const route = "/subgraphs/name/oceanprotocol/ocean-subgraph"
  
  const url = `${baseUrl}${route}`
  
  var config = {
    method: 'post',
    url: url,
    headers: { "Content-Type": "application/json" },
    data: JSON.stringify({ "query": query })
  };
  
  var r = axios(config)
    .then(function (response: { data: any; }) {
      console.log(JSON.stringify(response.data.data));
    })
    .catch(function (error: any) {
      console.log(error);
    });
  return r
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
    const datatoken = new Datatoken(web3)
    const DATATOKEN_AMOUNT = '1'
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
    // let consumerDTBalance = await web3.eth.getBalance(userAddress[0], )
    let consumerDTBalance = await balance(web3, dtAddress, userAddress[0])
    console.log(`Consumer ${dt.datatokens[0].symbol} balance before swap: ${consumerDTBalance}`)
    const r: any = await query(dtAddress)
    console.log("r", r)
    // console.log(r.data.fixedRateExchanges)
    const freAddressRinkeby = config.fixedRateExchangeAddress
    console.log("config freAddressRinkeby", config.fixedRateExchangeAddress)
    const oceanAddressRinkeby = config.oceanTokenAddress
    const txApprove = await approve(web3, userAddress[0], oceanAddressRinkeby, freAddressRinkeby, '100')

    const fixedRate = new FixedRateExchange(web3, freAddressRinkeby)
    fixedRate.oceanAddress = oceanAddressRinkeby
    console.log("fixedRate", fixedRate)


    // const freParams: any = {
    //   fixedRateAddress: config.fixedRateExchangeAddress,
    //   baseTokenAddress: config.oceanTokenAddress,
    //   owner: dt.event.from,
    //   marketFeeCollector: dt.event.from,
    //   baseTokenDecimals: 18,
    //   datatokenDecimals: 18,
    //   fixedRate: '1',
    //   marketFee: '0.001',
    //   withMint: false
    // }

    
    // console.log("freParams", freParams)
    
    const computeEnvs = await ProviderInstance.getComputeEnvironments(providerUrl)
    console.log("Available compute environments:", computeEnvs)
    // let's have 2 minutes of compute access
    const mytime = new Date()
    const computeMinutes = 1
    mytime.setMinutes(mytime.getMinutes() + computeMinutes)
    let computeValidUntil = Math.floor(mytime.getTime() / 1000)
    // const computeInit = await ProviderInstance.initializeCompute(resolvedDataDDO, algorithm, computeEnvs[0].id, computeValidUntil, providerUrl, userAddress[0])
    
    const initializeData =
    (await ProviderInstance.initialize(
      dt.id,
      dt.services[0].id,
      0,
      userAddress[0],
      dt.services[0].serviceEndpoint
      ))
      
      const orderParams: any = {
        consumer: computeEnvs[0].consumerAddress,
        serviceIndex: 0,
        _providerFee: initializeData.providerFee,
        _consumeMarketFee: {
          consumeMarketFeeAddress: '0x9984b2453eC7D99a73A5B3a46Da81f197B753C8d',
          consumeMarketFeeAmount: '0',
          consumeMarketFeeToken:
          '0x0000000000000000000000000000000000000000'
        }
      }
      
      const exchangeId = await fixedRate.generateExchangeId(config.oceanTokenAddress, dtAddress) // previously contracts.daiAddress
      console.log("exchangeId", exchangeId)

      const dtSupply = await fixedRate.getDTSupply(exchangeId)
      console.log("dtSupply", dtSupply)
      const btSupply = await fixedRate.getBTSupply(exchangeId)
      console.log("btSupply", btSupply)

      const baseInGivenOutDT = await fixedRate.calcBaseInGivenOutDT(exchangeId, '100')
      console.log("baseInGivenOutDT", baseInGivenOutDT)
      const amountBtOut = await fixedRate.getAmountBTOut(exchangeId, '100')
      console.log("amountBtOut", amountBtOut)




      // const tx = await fixedRate.buyDT(userAddress[0], exchangeId, '1', '100')
      // console.log("tx", tx)

      // const freParams: any = {
      //   exchangeContract: config.fixedRateExchangeAddress,
      //   exchangeId: exchangeId,
      //   maxBaseTokenAmount: '20',
      //   baseTokenAddress: config.oceanTokenAddress,
      //   baseTokenDecimals: config.oceanTokenAddress?.decimals || 18,
      //   swapMarketFee: '0',
      //   swapMarketFeeAddress: '0x9984b2453eC7D99a73A5B3a46Da81f197B753C8d'
      // }

      // console.log("freParams", freParams)


    // const orderParams: any = {
    //   consumer: userAddress[0],
    //   serviceIndex: dt.datatokens[0].serviceId,
    //   _providerFee: {
    //     providerFeeAddress: user1,
    //     providerFeeToken: providerFeeToken,
    //     providerFeeAmount: providerFeeAmount,
    //     v: v,
    //     r: r,
    //     s: s,
    //     providerData: web3.utils.toHex(web3.utils.asciiToHex(providerData)),
    //     validUntil: providerValidUntil
    //   },
    //   _consumeMarketFee: {
    //     consumeMarketFeeAddress: "0x0000000000000000000000000000000000000000",
    //     consumeMarketFeeToken: ZERO_ADDRESS,
    //     consumeMarketFeeAmount: "0",
    //   },
    // };

    // const accessDetails = await getAccessDetails(
    //   resolvedDataDDO.chainId,
    //   dtAddress,
    //   3600, // TODO: valid until
    //   userAddress[0], // previously payerAccount
    // );
    
    // const orderPriceAndFees = await getOrderPriceAndFees(resolvedDataDDO, accessDetails, order.providerFee);

    // const freParams: FreOrderParams = {
    //   exchangeContract: config.fixedRateExchangeAddress,
    //   exchangeId: accessDetails.addressOrId,
    //   maxBaseTokenAmount: orderPriceAndFees.price,
    //   baseTokenAddress: config.oceanTokenAddress,
    //   baseTokenDecimals: 18, // TODO: Here we assume 18 decimal token, might not be the case
    //   swapMarketFee: "0",
    //   marketFeeAddress: "0x0000000000000000000000000000000000000000",
    // };
    // resolvedDataDDO.accessDetails.addressOrId

    // const tx = await datatoken.buyFromFreAndOrder(dtAddress, userAddress[0], orderParams, freParams)
    // console.log("tx", tx)
    
    // BELOW IS WRONG
    // const nftParams: NftCreateData = {
    //   name: dt.nft.name,
    //   symbol: dt.nft.symbol,
    //   templateIndex: 1,
    //   tokenURI: '',
    //   transferable: true,
    //   owner: dt.event.from
    // }

    // const erc20Params: Erc20CreateParams = {
    //   templateIndex: 1,
    //   cap: '100000',
    //   feeAmount: '0',
    //   paymentCollector: ZERO_ADDRESS,
    //   feeToken: ZERO_ADDRESS,
    //   minter: dt.event.from,
    //   mpFeeAddress: ZERO_ADDRESS
    // }

    
    // const freNftAddress = tx.events.NFTCreated.returnValues[0]
    // const freDatatokenAddress = tx.events.TokenCreated.returnValues[0]
    // const freAddress = tx.events.NewFixedRate.returnValues.exchangeContract
    // const freId = tx.events.NewFixedRate.returnValues.exchangeId


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
  