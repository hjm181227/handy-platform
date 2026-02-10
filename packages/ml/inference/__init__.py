"""
Nail Segmentation Inference Server

This package provides a FastAPI-based inference server for nail segmentation.
"""

from .server import app, NailSegmentationModel

__all__ = ["app", "NailSegmentationModel"]
