# Classification Lab

A beginner-friendly, visual and practical learning resource for understanding **Machine Learning Classification**.

Classification Lab is a frontend-only educational website designed to explain classification concepts through clear explanations, mathematical intuition, visualizations, practical examples, and Python implementations.

The project is intentionally designed as a **public informational resource**, not as a learning management system.

---

## Overview

Machine learning classification can involve several interconnected concepts that are difficult to understand when learned only through theory.

Classification Lab aims to make these concepts easier to understand by connecting:

```text
Concept
   ↓
Intuition
   ↓
Mathematics
   ↓
Visualization
   ↓
Python Implementation
   ↓
Practical Application
```

The website will progressively cover the fundamentals of classification and the major classification algorithms:

* Classification fundamentals
* Binary and multiclass classification
* Classification metrics
* Logistic Regression
* K-Nearest Neighbors (KNN)
* Decision Trees
* Support Vector Machines (SVM)
* Model comparison
* Practical machine learning workflows

---

## Project Goals

The main goals of Classification Lab are to:

* Explain classification concepts in beginner-friendly language.
* Connect mathematical concepts with intuitive explanations.
* Visualize important machine learning concepts.
* Demonstrate classification algorithms using Python and Scikit-learn.
* Explain when different algorithms should be used.
* Help learners understand model evaluation and trade-offs.
* Provide a concise reference for classification concepts.
* Keep the learning experience simple and distraction-free.

---

## Core Philosophy

Classification Lab follows three principles:

### 1. Understand Before Implementing

The website focuses on understanding what an algorithm is doing before introducing its implementation.

### 2. Visualize Abstract Concepts

Concepts such as:

* Decision boundaries
* Classification thresholds
* KNN neighbors
* Tree splits
* SVM margins
* Support vectors

are easier to understand when represented visually.

### 3. Connect Theory to Practice

Mathematical concepts are connected to actual machine learning workflows and Python implementations.

---

## Topics Covered

### Classification Fundamentals

* What is classification?
* Classification vs regression
* Binary classification
* Multiclass classification
* Multilabel classification
* Features and labels
* Predictions
* Probabilities
* Classification thresholds
* Decision boundaries
* Classification workflow

### Classification Evaluation

* Confusion matrix
* True Positive
* True Negative
* False Positive
* False Negative
* Accuracy
* Precision
* Recall
* F1-score
* ROC curve
* ROC-AUC
* Precision-Recall curve
* PR-AUC
* Class imbalance
* Threshold selection

### Logistic Regression

* Linear score
* Sigmoid function
* Logistic function
* Probability estimation
* Decision boundary
* Log-odds
* Coefficients
* Binary cross-entropy / log loss
* Regularization
* L1 regularization
* L2 regularization
* `C` hyperparameter
* Scikit-learn implementation

### K-Nearest Neighbors

* KNN intuition
* Distance-based classification
* Euclidean distance
* Manhattan distance
* Choosing `K`
* Bias-variance trade-off
* Feature scaling
* Curse of dimensionality
* Decision boundaries
* Scikit-learn implementation

### Decision Trees

* Tree structure
* Root nodes
* Internal nodes
* Leaf nodes
* Feature-based splitting
* Gini impurity
* Entropy
* Information gain
* Tree depth
* Overfitting
* Pruning
* `max_depth`
* `min_samples_split`
* `min_samples_leaf`
* Scikit-learn implementation

### Support Vector Machines

* Hyperplanes
* Decision boundaries
* Margins
* Support vectors
* Maximum-margin classification
* Hard-margin SVM
* Soft-margin SVM
* `C`
* Kernel trick
* Linear kernel
* Polynomial kernel
* RBF kernel
* Gamma
* Nonlinear decision boundaries
* Feature scaling
* Scikit-learn implementation

---

## Planned Learning Structure

The website is being developed in phases.

```text
Phase 0
Foundation
        ↓
Phase 1
Classification Fundamentals
        ↓
Phase 2
Evaluation Metrics
        ↓
Phase 3
Logistic Regression
        ↓
Phase 4
K-Nearest Neighbors
        ↓
Phase 5
Decision Trees
        ↓
Phase 6
Support Vector Machines
        ↓
Phase 7
Model Comparison
        ↓
Phase 8
Practical Projects
        ↓
Phase 9
Final Polish & Deployment
```

Each phase is developed independently so that the content, UI, and interactive components can be reviewed before additional complexity is introduced.

---

## Website Structure

The planned information architecture is:

```text
Classification Lab
│
├── Home
│
├── Classification
│   ├── Introduction
│   ├── Binary Classification
│   ├── Multiclass Classification
│   ├── Multilabel Classification
│   └── Classification Workflow
│
├── Evaluation
│   ├── Confusion Matrix
│   ├── Accuracy
│   ├── Precision
│   ├── Recall
│   ├── F1 Score
│   ├── ROC-AUC
│   └── Precision-Recall
│
├── Algorithms
│   ├── Logistic Regression
│   ├── K-Nearest Neighbors
│   ├── Decision Trees
│   └── Support Vector Machines
│
├── Compare
│
└── Resources
```

---

## Design Philosophy

The interface is intentionally minimal.

The website is designed to feel like:

> **Interactive documentation + visual textbook + practical ML reference**

rather than:

> **Learning Management System + Dashboard + Gamification Platform**

The design prioritizes:

* Clear typography
* Strong visual hierarchy
* Minimal navigation
* Responsive layouts
* Readable mathematics
* Clear code examples
* Interactive visual explanations
* Low cognitive load
* Accessibility

---

## No User Tracking

Classification Lab is intentionally a **stateless informational website**.

There are no plans to implement:

* User accounts
* Authentication
* Login/signup
* User profiles
* Progress tracking
* Lesson completion
* Progress bars
* Streaks
* Points
* XP
* Badges
* Leaderboards
* Learning history
* Personalized recommendations
* User dashboards
* User activity tracking
* Analytics
* Tracking pixels
* User-specific cookies
* Backend user databases

Visitors can freely navigate and revisit any topic without their activity being stored.

---

## Technology Stack

### Frontend

* React
* TypeScript
* Vite
* Tailwind CSS

### Planned Supporting Technologies

Depending on the requirements of later phases:

* React-based visualization libraries
* Mathematical rendering
* Syntax highlighting
* Static curriculum data

The project will remain frontend-only.

---

## Project Structure

The project follows a modular React architecture:

```text
src/
│
├── components/
│   ├── layout/
│   │   ├── Header
│   │   ├── Footer
│   │   ├── Sidebar
│   │   └── MobileNavigation
│   │
│   ├── ui/
│   │   ├── Button
│   │   ├── Card
│   │   ├── Badge
│   │   ├── Callout
│   │   ├── Tabs
│   │   └── ThemeToggle
│   │
│   ├── learning/
│   │   ├── ConceptCard
│   │   ├── FormulaBlock
│   │   ├── ExampleBlock
│   │   ├── DefinitionBlock
│   │   └── ComparisonTable
│   │
│   └── visualization/
│       └── VisualizationContainer
│
├── pages/
│   ├── Home.tsx
│   ├── Classification.tsx
│   ├── Evaluation.tsx
│   ├── Algorithms.tsx
│   ├── Compare.tsx
│   └── Resources.tsx
│
├── data/
│   └── curriculum.ts
│
├── styles/
│
├── App.tsx
└── main.tsx
```

The exact structure may evolve as the project develops.

---

## Local Development

### Prerequisites

Make sure you have:

* Node.js 20+
* npm

installed.

### Clone the repository

```bash
git clone https://github.com/<your-username>/<repository-name>.git
```

### Navigate to the project

```bash
cd <repository-name>
```

### Install dependencies

```bash
npm install
```

### Start the development server

```bash
npm run dev
```

The development server will provide a local URL, usually:

```text
http://localhost:5173
```

---

## Production Build

Create a production build with:

```bash
npm run build
```

Preview the production build locally:

```bash
npm run preview
```

---

## GitHub Pages

Classification Lab is designed to be deployed as a static website using **GitHub Pages**.

The project does not require:

* A backend server
* Database hosting
* API hosting
* Authentication infrastructure

The intended deployment architecture is:

```text
GitHub Repository
       ↓
GitHub Actions
       ↓
Vite Production Build
       ↓
GitHub Pages
       ↓
Public Website
```

---

## Development Approach

Development is intentionally **phase-based**.

Each phase should:

1. Add one logical group of educational content.
2. Introduce only the components required for that phase.
3. Preserve the existing design system.
4. Avoid unnecessary dependencies.
5. Maintain GitHub Pages compatibility.
6. Keep the website frontend-only.
7. Avoid introducing user tracking or progress functionality.

This prevents the project from becoming unnecessarily complex as new educational content is added.

---

## Future Interactive Features

Later phases may introduce interactive visualizations for concepts such as:

* Sigmoid functions
* Classification thresholds
* Confusion matrices
* KNN neighbor voting
* KNN decision boundaries
* Decision tree splitting
* Tree depth and overfitting
* SVM hyperplanes
* SVM margins
* Support vectors
* Kernel behavior
* `C` and `gamma`

These interactions will be educational and **stateless**.

They will not record individual user activity or learning progress.

---

## Intended Audience

Classification Lab is primarily intended for:

* Machine learning beginners
* Data science students
* Python developers learning ML
* Students learning classification algorithms
* Developers who want a visual ML reference
* Anyone who wants to understand classification beyond simply calling `.fit()` and `.predict()`

Basic Python knowledge is helpful but advanced mathematics is not required to begin.

---

## Current Status

**Phase 0 — Foundation**

The current development focus is establishing:

* Project architecture
* Navigation
* Design system
* Responsive layout
* Educational page templates
* Reusable learning components
* Mathematical content styling
* Code block styling
* Visualization containers
* Static curriculum structure
* GitHub Pages compatibility

Detailed educational content and interactive algorithm visualizations will be introduced in subsequent phases.

---

## Roadmap

* [x] Define educational scope
* [x] Define curriculum structure
* [x] Define frontend architecture
* [x] Define no-tracking philosophy
* [ ] Build Phase 0 foundation
* [ ] Add classification fundamentals
* [ ] Add evaluation metrics
* [ ] Add Logistic Regression
* [ ] Add KNN
* [ ] Add Decision Trees
* [ ] Add SVM
* [ ] Add model comparison
* [ ] Add practical examples
* [ ] Add interactive visualizations
* [ ] Add Python/Scikit-learn implementations
* [ ] Final accessibility and responsive review
* [ ] Deploy to GitHub Pages

---

## Contributing

Contributions, corrections, and educational improvements are welcome.

When contributing, prioritize:

* Technical accuracy
* Beginner-friendly explanations
* Clear mathematical notation
* Minimal UI complexity
* Accessibility
* Performance
* Static frontend compatibility

Avoid introducing user tracking, authentication, progress systems, or unnecessary backend infrastructure.

---

## License

This project is intended as an educational resource.

Add the appropriate license for the repository before distributing or accepting external contributions.

---

## Author

**Alwin V J**

Built as a practical project for exploring and explaining machine learning classification concepts through interactive frontend experiences.
# Welcome to your Lovable project

This project was built with [Lovable](https://lovable.dev).

## Build with Lovable

Open your project in the [Lovable editor](https://lovable.dev) and keep building.

- **Ship faster**: describe what you want to build and Lovable handles the code.
- **Stay in sync**: connect the project to GitHub and every change made in Lovable is committed straight to your repository.
- **Full ownership**: this code is yours. Push to your repository and your changes sync back into Lovable, ready for your next prompt.

## Development

Prefer working locally? You need Node.js and npm — [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating).

```sh
git clone <this-repository-url>
cd <repository-name>
npm i
npm run dev
```

## Built with

- TanStack Start
- TypeScript
- React
- Tailwind CSS
