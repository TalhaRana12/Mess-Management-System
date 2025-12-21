async function generateIndividualBill() {
    // 1. Validation
    if (!selectedMember) {
        showToast("Please search and select a member first.", "error");
        return;
    }

    const month = parseInt(document.getElementById('searchMonth').value);
    const year = parseInt(document.getElementById('searchYear').value);
    const fee = parseFloat(document.getElementById('searchServiceFee').value) || 0;

    try {
        toggleBtn('searchBillBtn', true, 'Saving...');

        // 2. Calculate Costs based on real attendance
        const attData = getRealAttendanceData(selectedMember.userId, month, year);

        // 3. Prepare Payload for Server
        // API expects a List<TblBill>, so we put our single bill object inside an array [ ... ]
        const billsToSave = [{
            UserId: selectedMember.userId,
            Month: month,
            Year: year,
            TotalTeaWaterAmount: attData.teaTotal,
            TotalFoodAmount: attData.foodTotal,
            GrandTotal: attData.total + fee, // Include Service Fee in Grand Total
            IsPaid: false
        }];

        // 4. Send to Server
        const response = await fetch('/Bill/SaveBillsApi', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(billsToSave)
        });

        if (!response.ok) {
            throw new Error(await response.text());
        }

        // 5. Success! Update Local UI Data
        // Check if this bill existed previously in our local list
        const existingIdx = allBills.findIndex(b =>
            b.userId === selectedMember.userId &&
            b.month === month &&
            b.year === year
        );

        // Create the UI Data Object
        const savedBillData = {
            billId: existingIdx > -1 ? allBills[existingIdx].billId : 0, // Keep old ID or 0 if new
            userId: selectedMember.userId,
            month: month,
            year: year,
            totalTeaWaterAmount: attData.teaTotal,
            totalFoodAmount: attData.foodTotal,
            subtotal: attData.total,
            serviceFee: fee,
            grandTotal: attData.total + fee,
            isPaid: existingIdx > -1 ? allBills[existingIdx].isPaid : false,
            memberName: selectedMember.name,
            username: selectedMember.username,
            department: selectedMember.department,
            cnic: selectedMember.cnic,
            isComputed: true
        };

        // Update local array
        if (existingIdx > -1) {
            allBills[existingIdx] = { ...allBills[existingIdx], ...savedBillData };
        } else {
            allBills.push(savedBillData);
        }

        // Refresh the table view
        filteredBills = [...allBills];
        renderBillsTable();
        updateStatistics();

        // 6. Show the Bill Modal
        currentBillData = { ...savedBillData, attendanceDetails: attData.details };
        displayBillModal(currentBillData);

        showToast('Bill saved and generated successfully!', 'success');

    } catch (err) {
        console.error('Error generating bill:', err);
        showToast("Error saving bill: " + err.message, "error");
    } finally {
        toggleBtn('searchBillBtn', false, 'View Bill', 'receipt');
    }
}