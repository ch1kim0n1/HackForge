// Data Science and Machine Learning templates

function pythonJupyter(config) {
  return {
    requirements: `jupyter>=1.0.0
pandas>=2.0.0
numpy>=1.24.0
matplotlib>=3.7.0
seaborn>=0.12.0
scikit-learn>=1.3.0`,
    files: {
      'notebook.ipynb': JSON.stringify({
        cells: [
          {
            cell_type: "markdown",
            metadata: {},
            source: [`# ${config.projectName}\n`, `\n`, `${config.projectDescription}\n`, `\n`, `## Setup\n`]
          },
          {
            cell_type: "code",
            execution_count: null,
            metadata: {},
            outputs: [],
            source: [`import pandas as pd\n`, `import numpy as np\n`, `import matplotlib.pyplot as plt\n`, `import seaborn as sns\n`, `\n`, `# Set style\n`, `sns.set_style('whitegrid')\n`, `plt.rcParams['figure.figsize'] = (12, 8)\n`, `\n`, `print("🔨 ${config.projectName}")\n`, `print("${config.projectDescription}")\n`]
          },
          {
            cell_type: "markdown",
            metadata: {},
            source: [`## Load Data\n`]
          },
          {
            cell_type: "code",
            execution_count: null,
            metadata: {},
            outputs: [],
            source: [`# Example: Load sample data\n`, `df = pd.DataFrame({\n`, `    'x': np.random.randn(100),\n`, `    'y': np.random.randn(100),\n`, `    'category': np.random.choice(['A', 'B', 'C'], 100)\n`, `})\n`, `\n`, `df.head()\n`]
          },
          {
            cell_type: "markdown",
            metadata: {},
            source: [`## Exploratory Data Analysis\n`]
          },
          {
            cell_type: "code",
            execution_count: null,
            metadata: {},
            outputs: [],
            source: [`# Summary statistics\n`, `df.describe()\n`]
          },
          {
            cell_type: "code",
            execution_count: null,
            metadata: {},
            outputs: [],
            source: [`# Visualization\n`, `plt.figure(figsize=(10, 6))\n`, `sns.scatterplot(data=df, x='x', y='y', hue='category')\n`, `plt.title('Sample Scatter Plot')\n`, `plt.show()\n`]
          },
          {
            cell_type: "markdown",
            metadata: {},
            source: [`## Analysis\n`, `\n`, `Add your analysis code here.\n`]
          }
        ],
        metadata: {
          kernelspec: {
            display_name: "Python 3",
            language: "python",
            name: "python3"
          },
          language_info: {
            name: "python",
            version: "3.11.0"
          }
        },
        nbformat: 4,
        nbformat_minor: 4
      }, null, 2),
      'README.md': `# ${config.projectName}

${config.projectDescription}

## Setup

\`\`\`bash
# Create virtual environment
python -m venv venv
source venv/bin/activate  # On Windows: venv\\Scripts\\activate

# Install dependencies
pip install -r requirements.txt

# Start Jupyter
jupyter notebook
\`\`\`

## Usage

Open \`notebook.ipynb\` in Jupyter to start analyzing data.

## Libraries Included

- pandas: Data manipulation
- numpy: Numerical computing
- matplotlib: Plotting
- seaborn: Statistical visualization
- scikit-learn: Machine learning
`,
      '.gitignore': `venv/
__pycache__/
.ipynb_checkpoints/
*.pyc
.DS_Store`
    }
  };
}

function pythonPyTorch(config) {
  return {
    requirements: `torch>=2.1.0
torchvision>=0.16.0
numpy>=1.24.0
matplotlib>=3.7.0
tqdm>=4.66.0`,
    files: {
      'train.py': `import torch
import torch.nn as nn
import torch.optim as optim
from torch.utils.data import DataLoader, TensorDataset
import numpy as np
from tqdm import tqdm

print("🔨 ${config.projectName}")
print("${config.projectDescription}")
print()

# Check for GPU
device = torch.device('cuda' if torch.cuda.is_available() else 'cpu')
print(f'Using device: {device}')

# Simple Neural Network
class SimpleNet(nn.Module):
    def __init__(self, input_size, hidden_size, output_size):
        super(SimpleNet, self).__init__()
        self.fc1 = nn.Linear(input_size, hidden_size)
        self.relu = nn.ReLU()
        self.fc2 = nn.Linear(hidden_size, output_size)
    
    def forward(self, x):
        x = self.fc1(x)
        x = self.relu(x)
        x = self.fc2(x)
        return x

# Generate sample data
def generate_data(n_samples=1000):
    X = np.random.randn(n_samples, 10)
    y = (X[:, 0] + X[:, 1] > 0).astype(int)
    return torch.FloatTensor(X), torch.LongTensor(y)

# Training function
def train_model(model, train_loader, criterion, optimizer, epochs=10):
    model.train()
    for epoch in range(epochs):
        total_loss = 0
        correct = 0
        total = 0
        
        progress_bar = tqdm(train_loader, desc=f'Epoch {epoch+1}/{epochs}')
        for inputs, labels in progress_bar:
            inputs, labels = inputs.to(device), labels.to(device)
            
            optimizer.zero_grad()
            outputs = model(inputs)
            loss = criterion(outputs, labels)
            loss.backward()
            optimizer.step()
            
            total_loss += loss.item()
            _, predicted = outputs.max(1)
            total += labels.size(0)
            correct += predicted.eq(labels).sum().item()
            
            progress_bar.set_postfix({
                'loss': f'{total_loss/len(train_loader):.4f}',
                'acc': f'{100.*correct/total:.2f}%'
            })

if __name__ == '__main__':
    # Generate data
    X, y = generate_data()
    dataset = TensorDataset(X, y)
    train_loader = DataLoader(dataset, batch_size=32, shuffle=True)
    
    # Initialize model
    model = SimpleNet(input_size=10, hidden_size=64, output_size=2).to(device)
    criterion = nn.CrossEntropyLoss()
    optimizer = optim.Adam(model.parameters(), lr=0.001)
    
    # Train
    print("\\nStarting training...")
    train_model(model, train_loader, criterion, optimizer, epochs=10)
    
    # Save model
    torch.save(model.state_dict(), 'model.pth')
    print("\\nModel saved to model.pth")`,
      'README.md': `# ${config.projectName}

${config.projectDescription}

## Setup

\`\`\`bash
pip install -r requirements.txt
\`\`\`

## Training

\`\`\`bash
python train.py
\`\`\`

## Model Architecture

Simple neural network with:
- Input layer: 10 features
- Hidden layer: 64 neurons with ReLU
- Output layer: 2 classes

## Customization

Edit \`train.py\` to:
- Modify model architecture
- Change hyperparameters
- Use your own dataset
- Add validation
`,
      '.gitignore': `venv/
__pycache__/
*.pth
*.pt
.DS_Store`
    }
  };
}

function pythonTensorFlow(config) {
  return {
    requirements: `tensorflow>=2.14.0
numpy>=1.24.0
matplotlib>=3.7.0`,
    files: {
      'train.py': `import tensorflow as tf
from tensorflow import keras
import numpy as np
import matplotlib.pyplot as plt

print("🔨 ${config.projectName}")
print("${config.projectDescription}")
print()

# Check GPU availability
print("GPUs Available:", len(tf.config.list_physical_devices('GPU')))

# Generate sample data
def generate_data(n_samples=1000):
    X = np.random.randn(n_samples, 10)
    y = (X[:, 0] + X[:, 1] > 0).astype(int)
    return X, y

# Build model
def build_model(input_dim=10, hidden_dim=64, output_dim=2):
    model = keras.Sequential([
        keras.layers.Dense(hidden_dim, activation='relu', input_shape=(input_dim,)),
        keras.layers.Dropout(0.2),
        keras.layers.Dense(output_dim, activation='softmax')
    ])
    return model

if __name__ == '__main__':
    # Generate data
    X_train, y_train = generate_data()
    X_val, y_val = generate_data(200)
    
    # Build and compile model
    model = build_model()
    model.compile(
        optimizer='adam',
        loss='sparse_categorical_crossentropy',
        metrics=['accuracy']
    )
    
    print("\\nModel Summary:")
    model.summary()
    
    # Train
    print("\\nStarting training...")
    history = model.fit(
        X_train, y_train,
        validation_data=(X_val, y_val),
        epochs=10,
        batch_size=32,
        verbose=1
    )
    
    # Plot training history
    plt.figure(figsize=(12, 4))
    
    plt.subplot(1, 2, 1)
    plt.plot(history.history['loss'], label='Training Loss')
    plt.plot(history.history['val_loss'], label='Validation Loss')
    plt.title('Model Loss')
    plt.xlabel('Epoch')
    plt.ylabel('Loss')
    plt.legend()
    
    plt.subplot(1, 2, 2)
    plt.plot(history.history['accuracy'], label='Training Accuracy')
    plt.plot(history.history['val_accuracy'], label='Validation Accuracy')
    plt.title('Model Accuracy')
    plt.xlabel('Epoch')
    plt.ylabel('Accuracy')
    plt.legend()
    
    plt.tight_layout()
    plt.savefig('training_history.png')
    print("\\nTraining history saved to training_history.png")
    
    # Save model
    model.save('model.h5')
    print("Model saved to model.h5")`,
      'README.md': `# ${config.projectName}

${config.projectDescription}

## Setup

\`\`\`bash
pip install -r requirements.txt
\`\`\`

## Training

\`\`\`bash
python train.py
\`\`\`

## Model Architecture

Neural network with:
- Input layer: 10 features
- Hidden layer: 64 neurons with ReLU + Dropout(0.2)
- Output layer: 2 classes with softmax

## Output

- \`model.h5\`: Trained model
- \`training_history.png\`: Training metrics visualization

## Customization

Edit \`train.py\` to:
- Modify model architecture
- Change hyperparameters
- Use your own dataset
- Add more layers
`,
      '.gitignore': `venv/
__pycache__/
*.h5
*.png
.DS_Store`
    }
  };
}

module.exports = {
  pythonJupyter,
  pythonPyTorch,
  pythonTensorFlow
};
