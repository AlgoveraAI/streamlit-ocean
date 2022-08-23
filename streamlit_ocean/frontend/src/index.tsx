import React from "react"
import ReactDOM from "react-dom"
// import OceanDataComponent from "./OceanDataComponent"
import OceanAssetBuyComponent from "./OceanAssetBuyComponent"
import OceanCompute from "./OceanCompute"

ReactDOM.render(
  <React.StrictMode>
    <OceanAssetBuyComponent />
    <OceanCompute />
  </React.StrictMode>,
  document.getElementById("root")
)
