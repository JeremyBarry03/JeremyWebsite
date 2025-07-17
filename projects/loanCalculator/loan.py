import matplotlib.pyplot as plt
import seaborn as sns
import pandas as pd
import tkinter as tk
from tkinter import ttk
from tkinter import messagebox

# Function to calculate monthly payment
def calculate_monthly_payment(principal, annual_rate, years):
    monthly_rate = annual_rate / 12 / 100
    total_payments = years * 12
    monthly_payment = principal * (monthly_rate * (1 + monthly_rate)**total_payments) / ((1 + monthly_rate)**total_payments - 1)
    return monthly_payment

# Function to generate repayment schedule
def generate_repayment_schedule(principal, annual_rate, years):
    monthly_rate = annual_rate / 12 / 100
    total_payments = years * 12
    monthly_payment = calculate_monthly_payment(principal, annual_rate, years)

    balance = principal
    schedule = []

    for month in range(1, total_payments + 1):
        interest = balance * monthly_rate
        principal_payment = monthly_payment - interest
        balance -= principal_payment
        schedule.append((month, monthly_payment, principal_payment, interest, max(balance, 0)))

    return schedule

# Function to plot loan balance over time
def plot_balance_over_time(schedule):
    months = [entry[0] for entry in schedule]
    balances = [entry[4] for entry in schedule]

    plt.figure(figsize=(10, 6))
    sns.lineplot(x=months, y=balances, marker='o', color='blue')
    plt.title('Loan Balance Over Time')
    plt.xlabel('Month')
    plt.ylabel('Remaining Balance (USD)')
    plt.grid()
    plt.show()

# Function to plot interest and principal contributions over time
def plot_principal_interest(schedule):
    months = [entry[0] for entry in schedule]
    principal_payments = [entry[2] for entry in schedule]
    interest_payments = [entry[3] for entry in schedule]

    plt.figure(figsize=(10, 6))
    plt.plot(months, principal_payments, label='Principal', color='green', marker='o')
    plt.plot(months, interest_payments, label='Interest', color='red', marker='o')
    plt.title('Monthly Principal and Interest Contributions')
    plt.xlabel('Month')
    plt.ylabel('Payment (USD)')
    plt.legend()
    plt.grid()
    plt.show()

# GUI Functions
def calculate_and_display():
    try:
        principal = float(principal_entry.get())
        annual_rate = float(rate_entry.get())
        years = int(years_entry.get())

        monthly_payment = calculate_monthly_payment(principal, annual_rate, years)
        schedule = generate_repayment_schedule(principal, annual_rate, years)

        result_label.config(text=f"Monthly Payment: ${monthly_payment:.2f}\nTotal Payment: ${monthly_payment * years * 12:.2f}\nTotal Interest: ${(monthly_payment * years * 12) - principal:.2f}")

        def plot_graphs():
            plot_balance_over_time(schedule)
            plot_principal_interest(schedule)

        plot_button.config(command=plot_graphs, state=tk.NORMAL)
    except ValueError:
        messagebox.showerror("Input Error", "Please enter valid numbers for all fields.")

# GUI Setup
root = tk.Tk()
root.title("Loan Payment Calculator")

# Input Fields
ttk.Label(root, text="Loan Amount (USD):").grid(column=0, row=0, padx=10, pady=5, sticky=tk.W)
principal_entry = ttk.Entry(root)
principal_entry.grid(column=1, row=0, padx=10, pady=5)

ttk.Label(root, text="Annual Interest Rate (%):").grid(column=0, row=1, padx=10, pady=5, sticky=tk.W)
rate_entry = ttk.Entry(root)
rate_entry.grid(column=1, row=1, padx=10, pady=5)

ttk.Label(root, text="Loan Term (Years):").grid(column=0, row=2, padx=10, pady=5, sticky=tk.W)
years_entry = ttk.Entry(root)
years_entry.grid(column=1, row=2, padx=10, pady=5)

# Buttons and Result Display
calculate_button = ttk.Button(root, text="Calculate", command=calculate_and_display)
calculate_button.grid(column=0, row=3, columnspan=2, pady=10)

result_label = ttk.Label(root, text="", justify=tk.LEFT, font=("Arial", 10))
result_label.grid(column=0, row=4, columnspan=2, padx=10, pady=5)

plot_button = ttk.Button(root, text="Plot Graphs", state=tk.DISABLED)
plot_button.grid(column=0, row=5, columnspan=2, pady=10)

# Run the GUI
root.mainloop()
