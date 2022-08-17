import React from "react"
import ReactDOM from "react-dom"
import OceanDataComponent from "./OceanDataComponent"
import OceanAssetBuyComponent from "./OceanAssetBuyComponent"

ReactDOM.render(
  <React.StrictMode>
    <OceanDataComponent />
    <OceanAssetBuyComponent />
  </React.StrictMode>,
  document.getElementById("root")
)
