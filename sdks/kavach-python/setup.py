from setuptools import setup, find_packages
import os

with open(os.path.join(os.path.dirname(__file__), 'README.md'), encoding='utf-8') as f:
    long_description = f.read()

setup(
    name="rajeev02-kavach-sdk",
    version="1.0.4",
    description="Python SDK for the Kavach Shield Engine ecosystem.",
    long_description=long_description,
    long_description_content_type="text/markdown",
    packages=find_packages(),
    url="https://github.com/Rajeev02/kavachid",
)