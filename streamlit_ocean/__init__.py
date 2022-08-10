import streamlit.components.v1 as components
import streamlit as st
import os

from PIL import Image

import matplotlib.pyplot as plt
import numpy as np


term = st.text_input("Search for an asset by name", "")
did = st.text_input("Search for an asset by DID", "")
address = st.text_input("Insert address private key", "")


_ocean_data = components.declare_component("ocean_data", url="http://localhost:3001/")
def ocean_data(label, did="", key=None):
    """
    Wallet Connect component.
    """
    return _ocean_data(label=label, did=did, default="not", key=key)

ocean_data_button = ocean_data(label="ocean", did=did)
st.write(f"Ocean data for {ocean_data_button}")