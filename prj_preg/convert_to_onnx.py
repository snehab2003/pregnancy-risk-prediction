"""
Convert TensorFlow Keras model to ONNX format for better compatibility
"""
import sys
import os
sys.path.append('ml_contents')

try:
    import tf2onnx
    import tensorflow as tf
    from ml_contents.ml.model_loader import model

    # Convert the model to ONNX
    input_signature = [tf.TensorSpec([None, 6], tf.float32, name='input')]
    onnx_model, _ = tf2onnx.convert.from_keras(model, input_signature=input_signature)

    # Save the ONNX model
    onnx_path = os.path.join('ml_contents', 'ml', 'models', 'mlp_model.onnx')
    with open(onnx_path, 'wb') as f:
        f.write(onnx_model.SerializeToString())

    print(f"Model converted to ONNX and saved to {onnx_path}")

except Exception as e:
    print(f"Error converting model: {e}")
    import traceback
    traceback.print_exc()