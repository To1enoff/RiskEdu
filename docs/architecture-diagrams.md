# RiskEdu Architecture Diagrams

This file contains ready-to-use Mermaid diagrams for the thesis/report.

You can:
- preview them directly in GitHub,
- open them in VS Code with a Mermaid extension,
- export them to PNG/SVG for the final document.

## 1. Sequence Diagram

This diagram shows the runtime flow when a user submits academic data and receives a risk prediction.

```mermaid
---
id: 744b48a5-7514-4b60-bf70-fab0311f5ddf
---
sequenceDiagram
    actor User
    participant Frontend as Frontend (React/Vite)
    participant Backend as Backend API (NestJS)
    participant DB as PostgreSQL
    participant ML as ML Service (FastAPI)
    participant Model as Trained Model

    User->>Frontend: Enter course / week / exam / syllabus data
    Frontend->>Backend: POST /student/courses/...<br/>or POST /predict
    Backend->>DB: Save or update academic records
    DB-->>Backend: Persisted data

    Backend->>DB: Load student + course features
    DB-->>Backend: Structured academic features

    Backend->>ML: POST /predict-risk or /predict
    ML->>Model: Run inference on prepared features
    Model-->>ML: Prediction score + class
    ML-->>Backend: Risk probability + explainability data

    Backend->>DB: Save prediction history / suggestions
    DB-->>Backend: Saved

    Backend-->>Frontend: JSON response with risk result
    Frontend-->>User: Show risk, bucket, factors, suggestions
```

## 2. UML Component Diagram

This diagram shows the main software modules and their dependencies.

```mermaid
---
id: 55cf6743-894c-4494-a3ee-b1a649eb5b4c
---
flowchart LR
    User[User]
    Frontend[Frontend UI<br/>React + TypeScript + Vite]

    subgraph Backend[Backend API - NestJS]
        APIGateway[API Layer / Controllers]
        AuthModule[Auth Module]
        StudentsModule[Students Module]
        CoursesModule[Courses Module]
        AnalyticsModule[Analytics Module]
        MLModule[ML Module]
    end

    subgraph MLService[ML Service - FastAPI]
        PredictAPI[Prediction API]
        Explainability[Explainability Module]
        SuggestionLogic[AI Suggestion Logic]
        TrainedModel[Trained Risk Model]
    end

    Database[(PostgreSQL Database)]

    User --> Frontend
    Frontend --> APIGateway

    APIGateway --> AuthModule
    APIGateway --> StudentsModule
    APIGateway --> CoursesModule
    APIGateway --> AnalyticsModule
    APIGateway --> MLModule

    AuthModule --> Database
    StudentsModule --> Database
    CoursesModule --> Database
    AnalyticsModule --> Database

    MLModule --> PredictAPI
    PredictAPI --> Explainability
    PredictAPI --> SuggestionLogic
    PredictAPI --> TrainedModel

    SuggestionLogic --> Database
```

## 3. Data Flow Diagram (DFD)

This diagram focuses on how data travels from the interface into storage and prediction components.

```mermaid
---
id: 62dbd0d7-d752-42ad-8abc-da12c30fb381
---
flowchart TD
    UserInput[User Input<br/>grades, absences, syllabus, exams]
    UI[Frontend UI]
    API[Backend REST API]
    Rules[Business Rules<br/>validation, semester/week logic]
    DB[(PostgreSQL)]
    FeaturePrep[Feature Preparation]
    MLPredict[ML Prediction Service]
    Explain[Explainability / SHAP-like factors]
    Suggest[AI Suggestions]
    Response[Risk Result Response]

    UserInput --> UI
    UI --> API
    API --> Rules
    Rules --> DB

    DB --> FeaturePrep
    FeaturePrep --> MLPredict
    MLPredict --> Explain
    MLPredict --> Suggest

    Explain --> API
    Suggest --> API
    API --> DB
    API --> Response
    Response --> UI
```

## Suggested Captions For Thesis

### Figure X. Sequence diagram of prediction workflow
The sequence diagram illustrates how user-submitted academic data flows from the frontend to the backend, is persisted in the database, evaluated by the ML service, and returned to the user as a risk prediction with supporting analytical outputs.

### Figure X. UML component diagram of the RiskEdu system
The component diagram presents the modular architecture of RiskEdu, highlighting the separation between the frontend interface, backend business modules, ML inference service, and persistent storage layer.

### Figure X. Data flow diagram of the RiskEdu platform
The DFD shows how academic data is collected through the user interface, processed by backend rules and machine learning components, stored in the database, and transformed into prediction and recommendation outputs.

## Export Tips

If you need clean images for Word/PDF:
1. Open this file in GitHub or Mermaid Live Editor.
2. Render each diagram.
3. Export as `PNG` or `SVG`.
4. Use `SVG` if you want sharper print quality in the thesis.
