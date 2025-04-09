document.addEventListener('DOMContentLoaded', () => {
    const directTaxRadio = document.getElementById('directTax');
    const incomeRadio = document.getElementById('income');
    const taxDetailsInputs = document.getElementById('taxDetailsInputs');
    const incomeInputs = document.getElementById('incomeInputs');

    directTaxRadio.addEventListener('change', () => {
        taxDetailsInputs.style.display = 'block';
        incomeInputs.style.display = 'none';
    });

    incomeRadio.addEventListener('change', () => {
        taxDetailsInputs.style.display = 'none';
        incomeInputs.style.display = 'block';
    });

    // CGT Relief checkbox handler
    const wantCgtRelief = document.getElementById('wantCgtRelief');
    const reinvestedGains = document.getElementById('reinvestedGains');
    const isResidentialProperty = document.getElementById('isResidentialProperty');
    const cgtRate = document.getElementById('cgtRate');

    wantCgtRelief.addEventListener('change', (e) => {
        const isChecked = e.target.checked;
        reinvestedGains.disabled = !isChecked;
        isResidentialProperty.disabled = !isChecked;
        cgtRate.disabled = !isChecked;
        document.getElementById('calculateCgtRateBtn').disabled = !isChecked;
        
        if (!isChecked) {
            reinvestedGains.value = '';
            isResidentialProperty.checked = false;
            cgtRate.value = '';
            document.getElementById('cgtCalculationResults').style.display = 'none';
        }
    });

    // Add tax region selector
    const regionSelector = document.createElement('div');
    regionSelector.className = 'mb-3';
    regionSelector.innerHTML = `
        <label class="form-label">Tax Region</label>
        <select class="form-control" id="taxRegion">
            <option value="uk">England, Wales & Northern Ireland</option>
            <option value="scotland">Scotland</option>
        </select>
    `;
    document.getElementById('incomeInputs').prepend(regionSelector);

    // Add return multiple slider handler
    const returnSlider = document.getElementById('anticipatedReturn');
    const returnDisplay = document.getElementById('returnMultipleDisplay');
    
    returnSlider.addEventListener('input', (e) => {
        const value = parseFloat(e.target.value).toFixed(1);
        returnDisplay.textContent = `${value}x`;
    });
});

function calculateBenefits() {
    const isDirectTax = document.getElementById('directTax').checked;
    let incomeTaxRate, incomeTaxAmount, effectiveRate;
    const region = document.getElementById('taxRegion').value;

    if (isDirectTax) {
        incomeTaxAmount = parseFloat(document.getElementById('incomeTaxAmount').value);
        incomeTaxRate = parseFloat(document.getElementById('incomeTaxRate').value);
        effectiveRate = incomeTaxRate;
    } else {
        const annualIncome = parseFloat(document.getElementById('annualIncome').value);
        incomeTaxRate = getTopMarginalRate(annualIncome, region);
        effectiveRate = calculateTaxRate(annualIncome, region);
        incomeTaxAmount = calculateTaxAmount(annualIncome, region);
    }

    // Update tax rate display
    document.getElementById('effectiveTaxRate').textContent = `${effectiveRate.toFixed(2)}%`;
    document.getElementById('marginalTaxRate').textContent = `${incomeTaxRate.toFixed(2)}%`;

    // Calculate maximum eligible investments based on tax paid
    const maxSeisAllowance = Math.min(100000, incomeTaxAmount / 0.50);
    const maxEisAllowance = Math.min(1000000, incomeTaxAmount / 0.30);

    const cgtRate = parseFloat(document.getElementById('cgtRate').value || 0);
    const investmentAmount = parseFloat(document.getElementById('investmentAmount').value);
    const reinvestedGains = parseFloat(document.getElementById('reinvestedGains').value) || 0;
    const returnMultiple = parseFloat(document.getElementById('anticipatedReturn').value) || 0;

    // Calculate SEIS benefits
    const seisIncomeTaxRelief = calculateSEISIncomeTaxRelief(investmentAmount, incomeTaxAmount);
    const seisLossRelief = calculateLossRelief(Math.min(investmentAmount, 100000), incomeTaxRate, 'seis', incomeTaxAmount);
    const seisCgtDeferral = calculateCGTDeferral(reinvestedGains, cgtRate);
    const seisCgtRelief = calculateSEISCGTRelief(reinvestedGains, investmentAmount, cgtRate);
    const seisNetCost = calculateNetCost(Math.min(investmentAmount, 100000), seisIncomeTaxRelief, seisLossRelief);
    const seisAnticipatedGrowth = calculateAnticipatedGrowth(Math.min(investmentAmount, 100000), returnMultiple);
    const seisTaxFreeGain = calculateTaxFreeGain(Math.min(investmentAmount, 100000), seisAnticipatedGrowth);
    const seisNetProfit = seisAnticipatedGrowth - seisNetCost;
    const seisReturnOnNetCost = (seisNetProfit / seisNetCost) * 100;

    // Calculate EIS benefits
    const eisIncomeTaxRelief = calculateEISIncomeTaxRelief(investmentAmount, incomeTaxAmount);
    const eisLossRelief = calculateLossRelief(Math.min(investmentAmount, 1000000), incomeTaxRate, 'eis', incomeTaxAmount);
    const eisCgtDeferral = calculateCGTDeferral(reinvestedGains, cgtRate);
    const eisNetCost = calculateNetCost(Math.min(investmentAmount, 1000000), eisIncomeTaxRelief, eisLossRelief);
    const eisAnticipatedGrowth = calculateAnticipatedGrowth(Math.min(investmentAmount, 1000000), returnMultiple);
    const eisTaxFreeGain = calculateTaxFreeGain(Math.min(investmentAmount, 1000000), eisAnticipatedGrowth);
    const eisNetProfit = eisAnticipatedGrowth - eisNetCost;
    const eisReturnOnNetCost = (eisNetProfit / eisNetCost) * 100;

    // Update results
    document.getElementById('seisMaxAllowance').textContent = formatCurrency(maxSeisAllowance);
    document.getElementById('seisIncomeTaxRelief').textContent = formatCurrency(seisIncomeTaxRelief);
    document.getElementById('seisLossRelief').textContent = formatCurrency(seisLossRelief);
    document.getElementById('seisCgtDeferral').textContent = formatCurrency(seisCgtDeferral);
    document.getElementById('seisCgtRelief').textContent = formatCurrency(seisCgtRelief);
    document.getElementById('seisNetCost').textContent = formatCurrency(seisNetCost);
    document.getElementById('seisAnticipatedGrowth').textContent = formatCurrency(seisAnticipatedGrowth);
    document.getElementById('seisTaxFreeGain').textContent = formatCurrency(seisTaxFreeGain);
    document.getElementById('seisNetProfit').textContent = formatCurrency(seisNetProfit);
    document.getElementById('seisReturnOnNetCost').textContent = `${seisReturnOnNetCost.toFixed(2)}%`;
    
    document.getElementById('eisMaxAllowance').textContent = formatCurrency(maxEisAllowance);
    document.getElementById('eisIncomeTaxRelief').textContent = formatCurrency(eisIncomeTaxRelief);
    document.getElementById('eisLossRelief').textContent = formatCurrency(eisLossRelief);
    document.getElementById('eisCgtDeferral').textContent = formatCurrency(eisCgtDeferral);
    document.getElementById('eisNetCost').textContent = formatCurrency(eisNetCost);
    document.getElementById('eisAnticipatedGrowth').textContent = formatCurrency(eisAnticipatedGrowth);
    document.getElementById('eisTaxFreeGain').textContent = formatCurrency(eisTaxFreeGain);
    document.getElementById('eisNetProfit').textContent = formatCurrency(eisNetProfit);
    document.getElementById('eisReturnOnNetCost').textContent = `${eisReturnOnNetCost.toFixed(2)}%`;
}

function calculateTaxRate(income, region = 'uk') {
    if (region === 'scotland') {
        return calculateScottishTaxRate(income);
    }

    const tax = calculateTaxAmount(income);
    return (tax / income) * 100;
}

function calculateTaxAmount(income, region = 'uk') {
    if (region === 'scotland') {
        return calculateScottishTax(income);
    }
    
    // Constants for UK tax calculation
    const PERSONAL_ALLOWANCE_FULL = 12570;
    const PERSONAL_ALLOWANCE_TAPER_THRESHOLD = 100000;
    const PERSONAL_ALLOWANCE_ZERO_THRESHOLD = 125140;
    const BASIC_RATE_THRESHOLD = 50270;
    const HIGHER_RATE_THRESHOLD = 125140;
    
    const BASIC_RATE = 0.20;
    const HIGHER_RATE = 0.40;
    const ADDITIONAL_RATE = 0.45;

    // Calculate Personal Allowance
    let personalAllowance;
    if (income <= PERSONAL_ALLOWANCE_TAPER_THRESHOLD) {
        personalAllowance = PERSONAL_ALLOWANCE_FULL;
    } else if (income >= PERSONAL_ALLOWANCE_ZERO_THRESHOLD) {
        personalAllowance = 0;
    } else {
        const reduction = (income - PERSONAL_ALLOWANCE_TAPER_THRESHOLD) / 2;
        personalAllowance = Math.max(0, PERSONAL_ALLOWANCE_FULL - reduction);
    }

    // Calculate taxable income
    const taxableIncome = Math.max(0, income - personalAllowance);

    // Band 1: Basic rate (up to £50,270)
    const basicBand = Math.max(0, Math.min(taxableIncome, BASIC_RATE_THRESHOLD - personalAllowance));
    const basicTax = basicBand * BASIC_RATE;

    // Band 2: Higher rate (from £50,271 to £125,140)
    const higherBand = Math.max(0, Math.min(
        taxableIncome - basicBand,
        HIGHER_RATE_THRESHOLD - BASIC_RATE_THRESHOLD
    ));
    const higherTax = higherBand * HIGHER_RATE;

    // Band 3: Additional rate (over £125,140)
    const additionalBand = Math.max(0, taxableIncome - basicBand - higherBand);
    const additionalTax = additionalBand * ADDITIONAL_RATE;

    // Calculate total tax and effective rate
    const totalTax = basicTax + higherTax + additionalTax;
    const effectiveRate = (totalTax / income) * 100;

    // Generate breakdown for display
    if (document.getElementById('taxBreakdown')) {
        const breakdown = `
            <div>Personal Allowance: ${formatCurrency(personalAllowance)} (0%)</div>
            ${basicBand > 0 ? `<div>Basic Rate Band: ${formatCurrency(basicBand)} at 20% = ${formatCurrency(basicTax)}</div>` : ''}
            ${higherBand > 0 ? `<div>Higher Rate Band: ${formatCurrency(higherBand)} at 40% = ${formatCurrency(higherTax)}</div>` : ''}
            ${additionalBand > 0 ? `<div>Additional Rate Band: ${formatCurrency(additionalBand)} at 45% = ${formatCurrency(additionalTax)}</div>` : ''}
            <div class="mt-2">Total Tax: ${formatCurrency(totalTax)}</div>
            <div>Effective Tax Rate: ${effectiveRate.toFixed(2)}%</div>
        `;
        document.getElementById('taxBreakdown').innerHTML = breakdown;
    }

    return totalTax;
}

function calculateSEISIncomeTaxRelief(investment, incomeTaxAmount) {
    const rawRelief = Math.min(investment, 100000) * 0.50;
    return Math.min(rawRelief, incomeTaxAmount);
}

function calculateEISIncomeTaxRelief(investment, incomeTaxAmount) {
    const rawRelief = Math.min(investment, 1000000) * 0.30;
    return Math.min(rawRelief, incomeTaxAmount);
}

function calculateLossRelief(investment, marginalTaxRate, scheme = 'eis', incomeTaxAmount = 0) {
    const incomeTaxRelief = scheme === 'eis'
        ? calculateEISIncomeTaxRelief(investment, incomeTaxAmount)
        : calculateSEISIncomeTaxRelief(investment, incomeTaxAmount);

    const netLoss = investment - incomeTaxRelief;
    return netLoss * (marginalTaxRate / 100);
}


function calculateCGTDeferral(reinvestedGains, cgtRate) {
    return reinvestedGains * (cgtRate / 100);
}

function calculateSEISCGTRelief(reinvestedGains, investmentAmount, cgtRate) {
    const seis_reinvested_gains_relief_limit = Math.min(reinvestedGains, investmentAmount, 100000);
    return seis_reinvested_gains_relief_limit * (cgtRate / 100) * 0.50;
}

function calculateNetCost(investment, incomeTaxRelief, lossRelief) {
    return investment - incomeTaxRelief - lossRelief;
}

function formatCurrency(value) {
    return `£${value.toFixed(2)}`;
}

function calculateTaxOnly() {
    const annualIncome = parseFloat(document.getElementById('annualIncome').value);
    const region = document.getElementById('taxRegion').value;
    
    if (isNaN(annualIncome)) {
        alert('Please enter a valid annual income');
        return;
    }

    const taxAmount = calculateTaxAmount(annualIncome, region);
    const effectiveRate = (taxAmount / annualIncome * 100).toFixed(2);
    const marginalRate = getTopMarginalRate(annualIncome, region);
    
    // Show the results section
    const resultsDiv = document.getElementById('taxCalculationResults');
    resultsDiv.style.display = 'block';
    
    // Update the results
    document.getElementById('calculatedTaxAmount').textContent = formatCurrency(taxAmount);
    document.getElementById('effectiveTaxRate').textContent = `${effectiveRate}%`;
    document.getElementById('marginalTaxRate').textContent = `${marginalRate.toFixed(2)}%`;
    
    // Generate tax breakdown
    const breakdown = generateTaxBreakdown(annualIncome, region);
    document.getElementById('taxBreakdown').innerHTML = breakdown;
    
    // Auto-fill the tax details for the main calculation
    document.getElementById('incomeTaxAmount').value = taxAmount.toFixed(2);
    document.getElementById('incomeTaxRate').value = marginalRate.toFixed(2);
}

function generateTaxBreakdown(income, region) {
    let breakdown = '';
    let personalAllowance = 12570;
    
    // Calculate personal allowance reduction
    if (income > 100000) {
        const reduction = Math.min((income - 100000) / 2, personalAllowance);
        personalAllowance -= reduction;
        breakdown += `<div>Personal Allowance reduced to ${formatCurrency(personalAllowance)} due to high income</div>`;
    }

    if (region === 'scotland') {
        // Scottish tax breakdown
        const bands = [
            { threshold: 14876, rate: 19, name: 'Starter Rate' },
            { threshold: 26561, rate: 20, name: 'Basic Rate' },
            { threshold: 43662, rate: 21, name: 'Intermediate Rate' },
            { threshold: 75000, rate: 42, name: 'Higher Rate' },
            { threshold: 125140, rate: 45, name: 'Advanced Rate' },
            { threshold: Infinity, rate: 48, name: 'Top Rate' }
        ];
        breakdown += generateBandBreakdown(income, personalAllowance, bands);
    } else {
        // Rest of UK tax breakdown
        const bands = [
            { threshold: 50270, rate: 20, name: 'Basic Rate' },
            { threshold: 125140, rate: 40, name: 'Higher Rate' },
            { threshold: Infinity, rate: 45, name: 'Additional Rate' }
        ];
        breakdown += generateBandBreakdown(income, personalAllowance, bands);
    }
    
    return breakdown;
}

function generateBandBreakdown(income, personalAllowance, bands) {
    let breakdown = '';
    let remainingIncome = Math.max(0, income - personalAllowance);
    let previousThreshold = personalAllowance;
    
    if (income <= personalAllowance) {
        return '<div>Income within Personal Allowance - No tax due</div>';
    }
    
    breakdown += `<div>Personal Allowance: ${formatCurrency(personalAllowance)} (0%)</div>`;
    
    for (const band of bands) {
        if (remainingIncome > 0) {
            const taxableInThisBand = Math.min(
                remainingIncome,
                band.threshold - previousThreshold
            );
            
            if (taxableInThisBand > 0) {
                const taxInBand = taxableInThisBand * (band.rate / 100);
                breakdown += `<div>${band.name}: ${formatCurrency(taxableInThisBand)} at ${band.rate}% = ${formatCurrency(taxInBand)}</div>`;
            }
            
            remainingIncome -= taxableInThisBand;
            previousThreshold = band.threshold;
        }
    }
    
    return breakdown;
}

// Keep the Scottish tax calculation in a separate function
function calculateScottishTax(income) {
    // Constants for Scottish tax calculation
    const PERSONAL_ALLOWANCE_FULL = 12570;
    const PERSONAL_ALLOWANCE_TAPER_THRESHOLD = 100000;
    const PERSONAL_ALLOWANCE_ZERO_THRESHOLD = 125140;

    // Scottish Income Tax Bands (2024/25)
    const SCOTTISH_BANDS = [
        { lower: 0, upper: 14576, rate: 0.19, name: 'Starter Rate' },
        { lower: 14576, upper: 25688, rate: 0.20, name: 'Basic Rate' },
        { lower: 25688, upper: 43662, rate: 0.21, name: 'Intermediate Rate' },
        { lower: 43662, upper: 75000, rate: 0.42, name: 'Higher Rate' },
        { lower: 75000, upper: Infinity, rate: 0.45, name: 'Top Rate' }
    ];

    // Calculate Personal Allowance
    let personalAllowance;
    if (income <= PERSONAL_ALLOWANCE_TAPER_THRESHOLD) {
        personalAllowance = PERSONAL_ALLOWANCE_FULL;
    } else if (income >= PERSONAL_ALLOWANCE_ZERO_THRESHOLD) {
        personalAllowance = 0;
    } else {
        const reduction = (income - PERSONAL_ALLOWANCE_TAPER_THRESHOLD) / 2;
        personalAllowance = Math.max(0, PERSONAL_ALLOWANCE_FULL - reduction);
    }

    // Calculate taxable income
    const taxableIncome = Math.max(0, income - personalAllowance);
    let totalTax = 0;
    let remainingIncome = taxableIncome;
    let taxBreakdown = [];

    // Calculate tax for each band
    for (const band of SCOTTISH_BANDS) {
        const bandLower = Math.max(band.lower, personalAllowance);
        const bandIncome = Math.max(0, Math.min(remainingIncome, band.upper - bandLower));
        const bandTax = bandIncome * band.rate;
        
        if (bandIncome > 0) {
            taxBreakdown.push({
                name: band.name,
                income: bandIncome,
                rate: band.rate * 100,
                tax: bandTax
            });
        }

        totalTax += bandTax;
        remainingIncome -= bandIncome;

        if (remainingIncome <= 0) break;
    }

    const effectiveRate = (totalTax / income) * 100;

    // Generate breakdown for display
    if (document.getElementById('taxBreakdown')) {
        const breakdown = `
            <div>Personal Allowance: ${formatCurrency(personalAllowance)} (0%)</div>
            ${taxBreakdown.map(band => 
                `<div>${band.name}: ${formatCurrency(band.income)} at ${band.rate}% = ${formatCurrency(band.tax)}</div>`
            ).join('')}
            <div class="mt-2">Total Tax: ${formatCurrency(totalTax)}</div>
            <div>Effective Tax Rate: ${effectiveRate.toFixed(2)}%</div>
        `;
        document.getElementById('taxBreakdown').innerHTML = breakdown;
    }

    return totalTax;
}

function calculateScottishTaxRate(income) {
    const tax = calculateScottishTax(income);
    return (tax / income) * 100;
}

function calculateCGTRate() {
    const CGT_ALLOWANCE = 3000;
    const BASIC_RATE_LIMIT = 50270;
    
    const CGT_RATES = {
        non_residential: { basic: 0.10, higher: 0.20 },
        residential: { basic: 0.18, higher: 0.24 }
    };

    // Get values from form
    const isDirectTax = document.getElementById('directTax').checked;
    let income;
    if (isDirectTax) {
        const taxAmount = parseFloat(document.getElementById('incomeTaxAmount').value);
        const taxRate = parseFloat(document.getElementById('incomeTaxRate').value);
        income = taxAmount / (taxRate / 100);
    } else {
        income = parseFloat(document.getElementById('annualIncome').value);
    }
    
    const capital_gain = parseFloat(document.getElementById('reinvestedGains').value);
    const is_residential = document.getElementById('isResidentialProperty').checked;

    if (isNaN(income) || isNaN(capital_gain)) {
        alert('Please enter valid income and capital gain amounts');
        return;
    }

    // Determine marginal CGT rate based on income
    const marginalRate = income <= BASIC_RATE_LIMIT
        ? (is_residential ? 18 : 10)
        : (is_residential ? 24 : 20);

    // Calculate taxable gain and tax amounts for display purposes
    const taxable_gain = Math.max(0, capital_gain - CGT_ALLOWANCE);
    const total_cgt = taxable_gain * (marginalRate / 100);

    // Show results
    document.getElementById('cgtCalculationResults').style.display = 'block';
    document.getElementById('calculatedCgtRate').textContent = `${marginalRate.toFixed(2)}%`;
    document.getElementById('cgtRate').value = marginalRate.toFixed(2);

    // Generate breakdown
    const breakdown = `
        <div>CGT Allowance: ${formatCurrency(CGT_ALLOWANCE)}</div>
        <div>Taxable Gain: ${formatCurrency(taxable_gain)}</div>
        <div>CGT Rate: ${marginalRate.toFixed(2)}%</div>
        <div class="mt-2">Total CGT: ${formatCurrency(total_cgt)}</div>
    `;
    document.getElementById('cgtBreakdown').innerHTML = breakdown;
}

function calculateAnticipatedGrowth(investment, returnMultiple) {
    return investment * returnMultiple;
}

function calculateTaxFreeGain(investment, anticipatedGrowth) {
    return anticipatedGrowth - investment;
}

function getTopMarginalRate(income, region = 'uk') {
    if (region === 'scotland') {
        if (income <= 12570) return 0;
        if (income <= 14576) return 19;
        if (income <= 25688) return 20;
        if (income <= 43662) return 21;
        if (income <= 75000) return 42;
        return 45;
    } else {
        if (income <= 12570) return 0;
        if (income <= 50270) return 20;
        if (income <= 125140) return 40;
        return 45;
    }
} 