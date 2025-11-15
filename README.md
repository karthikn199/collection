# Collection Agent Management System

A comprehensive web application for collection agents to manage customers, loans, and daily collections. Built with React.js and uses localStorage for data persistence.

## Features

- **Customer Master**: Manage customer information (name, phone, address, email)
- **Loan Master**: Create loan templates with loan amount and daily collection amount
- **Customer-Loan Mapping**: Link customers with loan templates
- **Collection Loans**: Record daily collections from customers
- **Reports**: View daily and monthly collection reports with export functionality
- **Dashboard**: Overview of key metrics and recent activities

## Core Flow

1. Agent gives ₹10,000 to a customer
2. Agent collects ₹100 per day from the customer
3. Track all collections and generate reports

## Installation

1. Install dependencies:
```bash
npm install
```

2. Start the development server:
```bash
npm start
```

3. Open [http://localhost:3000](http://localhost:3000) in your browser

## Usage

1. **Add Customers**: Go to Customers section and add customer details
2. **Create Loan Templates**: Go to Loans section and create loan templates (default: ₹10,000 loan, ₹100 daily collection)
3. **Map Customers to Loans**: Go to Mapping section and link customers with loan templates
4. **Record Collections**: Go to Collections section and record daily collections
5. **View Reports**: Go to Reports section to view daily/monthly reports
6. **Dashboard**: View overview of all activities and statistics

## Data Storage

All data is stored in browser's localStorage. Data persists even after closing the browser.

## Technologies Used

- React.js 18
- React Router DOM 6
- HTML5
- CSS3 (Responsive Design)
- LocalStorage API

## Mobile Responsive

The application is fully responsive and works seamlessly on mobile devices, tablets, and desktops.

## Browser Support

- Chrome (latest)
- Firefox (latest)
- Safari (latest)
- Edge (latest)


