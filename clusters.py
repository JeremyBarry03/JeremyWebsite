import pandas as pd
import numpy as np
from sklearn.cluster import KMeans
import matplotlib.pyplot as plt
import seaborn as sns

# Load dataset
df = pd.read_csv('Customer_Transactions.csv')

# Data Cleaning
df.dropna(subset=['CustomerID'], inplace=True)  # Remove rows with missing CustomerID
df['TransactionDate'] = pd.to_datetime(df['TransactionDate'])  # Convert TransactionDate to datetime
df = df[df['Quantity'] > 0]  # Remove negative or zero Quantity
df['TotalPrice'] = df['Quantity'] * df['UnitPrice']  # Calculate total price for each transaction

# Calculate RFM values
snapshot_date = df['TransactionDate'].max() + pd.Timedelta(days=1)  # Snapshot date
rfm = df.groupby('CustomerID').agg(
    Recency=('TransactionDate', lambda x: (snapshot_date - x.max()).days),  # Recency
    Frequency=('TransactionDate', 'count'),  # Frequency
    Monetary=('TotalPrice', 'sum')  # Monetary
).reset_index()

# Log Transformation to reduce skewness
rfm['Monetary'] = rfm['Monetary'].apply(lambda x: np.log1p(x))

# Standardize the data
from sklearn.preprocessing import StandardScaler
scaler = StandardScaler()
rfm_scaled = scaler.fit_transform(rfm[['Recency', 'Frequency', 'Monetary']])

# Apply K-means clustering
kmeans = KMeans(n_clusters=4, random_state=42)
rfm['Cluster'] = kmeans.fit_predict(rfm_scaled)

# Assign descriptive names to clusters
cluster_names = {
    0: "Loyal Customers",
    1: "At-Risk Customers",
    2: "Big Spenders",
    3: "Casual Shoppers"
}
rfm['Cluster_Name'] = rfm['Cluster'].map(cluster_names)

# Visualize Clusters with Separate Graphs
fig, axes = plt.subplots(1, 2, figsize=(16, 6))

# Bar Chart: Customer Counts
cluster_counts = rfm['Cluster_Name'].value_counts()
axes[0].bar(cluster_counts.index, cluster_counts.values, color='#4CAF50')
axes[0].set_title('Number of Customers by Cluster', fontsize=14)
axes[0].set_xlabel('Customer Segments', fontsize=12)
axes[0].set_ylabel('Number of Customers', fontsize=12)
axes[0].set_xticks(range(len(cluster_counts.index)))
axes[0].set_xticklabels(cluster_counts.index, rotation=45, ha='right')
axes[0].grid(visible=True, which='both', linestyle='--', linewidth=0.5)

# Bar Chart: Average Spending
avg_spending = rfm.groupby('Cluster_Name')['Monetary'].mean().apply(np.expm1)
axes[1].bar(avg_spending.index, avg_spending.values, color='#2196F3')
axes[1].set_title('Average Spending by Cluster', fontsize=14)
axes[1].set_xlabel('Customer Segments', fontsize=12)
axes[1].set_ylabel('Average Spending ($)', fontsize=12)
axes[1].set_xticks(range(len(avg_spending.index)))
axes[1].set_xticklabels(avg_spending.index, rotation=45, ha='right')
axes[1].grid(visible=True, which='both', linestyle='--', linewidth=0.5)

plt.tight_layout()
plt.savefig('Customer_Clusters_SeparateGraphs.png')
plt.show()

# Cluster Summary
cluster_summary = rfm.groupby('Cluster_Name').agg({
    'Recency': 'mean',
    'Frequency': 'mean',
    'Monetary': lambda x: np.expm1(x).mean(),  # Undo log transformation for reporting
    'CustomerID': 'count'
}).rename(columns={'CustomerID': 'CustomerCount'})

# Save the summary to a CSV file
cluster_summary.to_csv('Cluster_Summary_Report.csv', index=False)

# Generate Text Report
with open("Customer_Segmentation_Report.txt", "w") as report_file:
    report_file.write("Customer Segmentation Report\n")
    report_file.write("="*30 + "\n\n")
    for cluster_name, data in cluster_summary.iterrows():
        report_file.write(f"Cluster: {cluster_name}\n")
        report_file.write(f"  - Avg Recency: {data['Recency']:.2f} days\n")
        report_file.write(f"  - Avg Frequency: {data['Frequency']:.2f} orders\n")
        report_file.write(f"  - Avg Monetary Value: ${data['Monetary']:.2f}\n")
        report_file.write(f"  - Total Customers: {int(data['CustomerCount'])}\n\n")
