transitops/
├── backend/
│   ├── src/
│   │   ├── config/
│   │   │   ├── db.js                      # MongoDB connection
│   │   │   ├── env.js                     # Env variable loader/validator
│   │   │   └── constants.js               # Enums: VehicleStatus, DriverStatus, TripStatus, Roles
│   │   │
│   │   ├── models/
│   │   │   ├── User.model.js
│   │   │   ├── Role.model.js
│   │   │   ├── Vehicle.model.js
│   │   │   ├── Driver.model.js
│   │   │   ├── Trip.model.js
│   │   │   ├── MaintenanceLog.model.js
│   │   │   ├── FuelLog.model.js
│   │   │   └── Expense.model.js
│   │   │
│   │   ├── controllers/
│   │   │   ├── auth.controller.js
│   │   │   ├── dashboard.controller.js
│   │   │   ├── vehicle.controller.js
│   │   │   ├── driver.controller.js
│   │   │   ├── trip.controller.js
│   │   │   ├── maintenance.controller.js
│   │   │   ├── fuel.controller.js
│   │   │   ├── expense.controller.js
│   │   │   └── report.controller.js
│   │   │
│   │   ├── routes/
│   │   │   ├── index.js                   # Combines all route modules
│   │   │   ├── auth.routes.js
│   │   │   ├── dashboard.routes.js
│   │   │   ├── vehicle.routes.js
│   │   │   ├── driver.routes.js
│   │   │   ├── trip.routes.js
│   │   │   ├── maintenance.routes.js
│   │   │   ├── fuel.routes.js
│   │   │   ├── expense.routes.js
│   │   │   └── report.routes.js
│   │   │
│   │   ├── middleware/
│   │   │   ├── auth.middleware.js         # JWT verification
│   │   │   ├── rbac.middleware.js         # Role-based access control
│   │   │   ├── errorHandler.middleware.js
│   │   │   ├── validate.middleware.js     # Joi/Zod request validation
│   │   │   └── asyncHandler.js
│   │   │
│   │   ├── services/
│   │   │   ├── auth.service.js
│   │   │   ├── vehicle.service.js
│   │   │   ├── driver.service.js
│   │   │   ├── trip.service.js            # Dispatch/complete/cancel business logic
│   │   │   ├── maintenance.service.js     # Status transition logic
│   │   │   ├── fuel.service.js
│   │   │   ├── expense.service.js
│   │   │   ├── report.service.js          # ROI, utilization, efficiency calc
│   │   │   └── email.service.js           # License expiry reminders (bonus)
│   │   │
│   │   ├── validators/
│   │   │   ├── auth.validator.js
│   │   │   ├── vehicle.validator.js
│   │   │   ├── driver.validator.js
│   │   │   ├── trip.validator.js
│   │   │   └── maintenance.validator.js
│   │   │
│   │   ├── utils/
│   │   │   ├── apiResponse.js
│   │   │   ├── apiError.js
│   │   │   ├── csvExporter.js
│   │   │   ├── pdfExporter.js             # Bonus
│   │   │   └── logger.js
│   │   │
│   │   ├── jobs/
│   │   │   └── licenseExpiryCron.js       # Bonus: scheduled email reminders
│   │   │
│   │   ├── app.js                         # Express app setup
│   │   └── server.js                      # Entry point
│   │
│   ├── tests/
│   │   ├── unit/
│   │   │   ├── trip.service.test.js
│   │   │   └── maintenance.service.test.js
│   │   └── integration/
│   │       ├── auth.test.js
│   │       └── trip.test.js
│   │
│   ├── .env
│   ├── .env.example
│   ├── .gitignore
│   ├── package.json
│   └── seed.js                            # Seed sample vehicles/drivers/users
│
├── frontend/
│   ├── public/
│   │   ├── favicon.ico
│   │   └── index.html
│   │
│   ├── src/
│   │   ├── api/
│   │   │   ├── axiosInstance.js           # Base axios config + interceptors
│   │   │   ├── auth.api.js
│   │   │   ├── vehicle.api.js
│   │   │   ├── driver.api.js
│   │   │   ├── trip.api.js
│   │   │   ├── maintenance.api.js
│   │   │   ├── fuel.api.js
│   │   │   ├── expense.api.js
│   │   │   └── report.api.js
│   │   │
│   │   ├── app/
│   │   │   ├── store.js                   # Redux store / Zustand store
│   │   │   └── rootReducer.js
│   │   │
│   │   ├── features/
│   │   │   ├── auth/
│   │   │   │   ├── authSlice.js
│   │   │   │   ├── LoginPage.jsx
│   │   │   │   └── ProtectedRoute.jsx
│   │   │   │
│   │   │   ├── dashboard/
│   │   │   │   ├── DashboardPage.jsx
│   │   │   │   ├── KpiCard.jsx
│   │   │   │   └── DashboardFilters.jsx
│   │   │   │
│   │   │   ├── vehicles/
│   │   │   │   ├── VehicleListPage.jsx
│   │   │   │   ├── VehicleFormModal.jsx
│   │   │   │   ├── VehicleDetailsPage.jsx
│   │   │   │   └── vehicleSlice.js
│   │   │   │
│   │   │   ├── drivers/
│   │   │   │   ├── DriverListPage.jsx
│   │   │   │   ├── DriverFormModal.jsx
│   │   │   │   ├── DriverDetailsPage.jsx
│   │   │   │   └── driverSlice.js
│   │   │   │
│   │   │   ├── trips/
│   │   │   │   ├── TripListPage.jsx
│   │   │   │   ├── TripFormModal.jsx      # Source/dest/vehicle/driver/cargo select
│   │   │   │   ├── TripDetailsPage.jsx
│   │   │   │   └── tripSlice.js
│   │   │   │
│   │   │   ├── maintenance/
│   │   │   │   ├── MaintenanceListPage.jsx
│   │   │   │   ├── MaintenanceFormModal.jsx
│   │   │   │   └── maintenanceSlice.js
│   │   │   │
│   │   │   ├── fuelExpense/
│   │   │   │   ├── FuelLogPage.jsx
│   │   │   │   ├── ExpenseLogPage.jsx
│   │   │   │   ├── FuelFormModal.jsx
│   │   │   │   ├── ExpenseFormModal.jsx
│   │   │   │   └── fuelExpenseSlice.js
│   │   │   │
│   │   │   └── reports/
│   │   │       ├── ReportsPage.jsx
│   │   │       ├── FuelEfficiencyChart.jsx
│   │   │       ├── UtilizationChart.jsx
│   │   │       ├── RoiChart.jsx
│   │   │       └── ExportButtons.jsx
│   │   │
│   │   ├── components/
│   │   │   ├── layout/
│   │   │   │   ├── Sidebar.jsx
│   │   │   │   ├── Navbar.jsx
│   │   │   │   ├── AppLayout.jsx
│   │   │   │   └── ThemeToggle.jsx        # Bonus: dark mode
│   │   │   ├── common/
│   │   │   │   ├── DataTable.jsx
│   │   │   │   ├── StatusBadge.jsx
│   │   │   │   ├── SearchFilterBar.jsx
│   │   │   │   ├── ConfirmDialog.jsx
│   │   │   │   ├── LoadingSpinner.jsx
│   │   │   │   └── Pagination.jsx
│   │   │   └── forms/
│   │   │       ├── FormInput.jsx
│   │   │       ├── FormSelect.jsx
│   │   │       └── FormDatePicker.jsx
│   │   │
│   │   ├── hooks/
│   │   │   ├── useAuth.js
│   │   │   ├── useDebounce.js
│   │   │   └── useFetch.js
│   │   │
│   │   ├── context/
│   │   │   └── ThemeContext.jsx
│   │   │
│   │   ├── constants/
│   │   │   ├── roles.js
│   │   │   └── statusEnums.js
│   │   │
│   │   ├── utils/
│   │   │   ├── formatters.js              # Currency, date formatting
│   │   │   ├── validators.js
│   │   │   └── calculations.js            # Frontend ROI/efficiency helpers
│   │   │
│   │   ├── routes/
│   │   │   └── AppRoutes.jsx
│   │   │
│   │   ├── styles/
│   │   │   ├── globals.css
│   │   │   └── theme.css
│   │   │
│   │   ├── App.jsx
│   │   └── main.jsx                       # (or index.js if CRA)
│   │
│   ├── .env
│   ├── .env.example
│   ├── .gitignore
│   ├── index.html                         # if Vite
│   ├── vite.config.js                     # or webpack config / CRA config
│   ├── tailwind.config.js
│   └── package.json
│
├── docs/
│   ├── ER-diagram.png
│   ├── API-endpoints.md
│   └── setup-instructions.md
│
├── .gitignore
├── README.md
└── docker-compose.yml                     # Optional: mongo + backend + frontend
