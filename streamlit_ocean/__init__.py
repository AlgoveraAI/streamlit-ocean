from ast import arg
import streamlit.components.v1 as components
import streamlit as st
import os

from PIL import Image

import matplotlib.pyplot as plt
import numpy as np

from wallet_connect import connect

from ocean_lib.config import Config
from ocean_lib.ocean.ocean import Ocean
from ocean_lib.web3_internal.wallet import Wallet
from ocean_lib.web3_internal.constants import ZERO_ADDRESS
from ocean_lib.web3_internal.currency import pretty_ether_and_wei, to_wei


def search(term="", did_in="", address=""):
    """
    Search for an asset on the Ocean Marketplace.

    Args:
        term (str): The search term.
        did_in (str): The DID of the asset.
        address (str): The address of your Web3 wallet.
    """
    
    results = None
    dids = None
    data=None
    if term and not did_in:
        assets = ocean.assets.search(term)

        results = []
        datas = []
        balances = []
        dids = []
        for i in range(len(assets)):
            name = assets[i].metadata['name']
            type_ = assets[i].metadata['type'].upper()
            symbol = assets[i].datatokens[0]['symbol']
            data_token_address = assets[i].datatokens[0]['address']
            try:
                description = assets[i].metadata['description']
            except:
                description = "No description"
            author = assets[i].metadata['author']
            did = assets[i].did
            dids.append(did)
            chain = assets[i].services[0].service_endpoint
            
            if address:
                data_token = ocean.get_datatoken(data_token_address)
                token_address = data_token.address
                balances.append(pretty_ether_and_wei(data_token.balanceOf(address)))
            else:
                balances.append(0)
            
            img = Image.open('./wallet_connect/algovera-tile.png')

            fig = plt.figure(figsize=(5,5))
            plt.axis("off")
            plt.imshow(img)
            plt.text(20, 100, name[:22], size=20)
            plt.text(20, 60, symbol)
            plt.text(400, 40, type_)
            plt.text(20, 140, author, size=12)
            plt.text(20, 200, description[:50])
            fig.tight_layout()
            fig.canvas.draw()
            data = np.frombuffer(fig.canvas.tostring_rgb(), dtype=np.uint8)
            datas.append(data.reshape(fig.canvas.get_width_height()[::-1] + (3,)))
            plt.close()
            
            results.append([dids[-1], datas[-1], balances[-1]])
    
    if did_in:
        results = []
        balances = []
        datas = []
        dids = []
        
        asset = ocean.assets.resolve(did_in)        
        name = asset.metadata['name']
        type_ = asset.metadata['type'].upper()
        symbol = asset.datatokens[0]['symbol']
        try:
            description = asset.metadata['description']
        except:
            description = "No description"
        author = asset.metadata['author']
        dids.append(did_in)
        chain = asset.services[0].service_endpoint
        
        if address:
            data_token = ocean.get_datatoken(asset.datatokens[0]["address"])
            token_address = data_token.address
            balances.append(pretty_ether_and_wei(data_token.balanceOf(address)))
        else:
            balances.append(0)
        
        
        
        img = Image.open('algovera-tile.png')

        fig = plt.figure(figsize=(5,5))
        plt.axis("off")
        plt.imshow(img)
        plt.text(20, 100, name[:22], size=20)
        plt.text(20, 60, symbol)
        plt.text(400, 40, type_)
        plt.text(20, 140, author, size=12)
        plt.text(20, 200, description[:50])
        fig.tight_layout()
        fig.canvas.draw()
        data = np.frombuffer(fig.canvas.tostring_rgb(), dtype=np.uint8)
        datas.append(data.reshape(fig.canvas.get_width_height()[::-1] + (3,)))
        plt.close()
        
        results.append([dids[-1], datas[-1], balances[-1]])

    return results 


user_address = connect(label="connect_button")
st.write(user_address[0])

term = st.text_input("Search for an asset by name", "")
did = st.text_input("Search for an asset by DID", "")

did_out, image_out, balance_out = st.button(label="Search", on_click=search, args=[term, did, user_address])
st.write(f"Asset DID: {did_out}")
st.image(image_out)
st.write(f"Balance at address {user_address}: {balance_out}")

# Ocean Search
config = Config('./wallet_connect/config.ini')
ocean = Ocean(config)

_ocean_data = components.declare_component("ocean_data", url="http://localhost:3001/")
def ocean_data(label, did="", key=None):
    """
    Wallet Connect component.
    """
    return _ocean_data(label=label, did=did, default="not", key=key)

ocean_data_button = ocean_data(label="ocean", did=did)
st.write(f"Ocean data for {ocean_data_button}")


