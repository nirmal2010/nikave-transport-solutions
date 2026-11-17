-- ============================================================================
-- NIKAVE TRANSPORT SOLUTIONS — DATABASE DDL SCHEMA (POSTGRESQL / NEON)
-- 
-- STRICT CONSTRAINTS APPLIED:
-- 1. All tables use UUID primary keys (id UUID PRIMARY KEY DEFAULT gen_random_uuid())
-- 2. All tables have default created_at & updated_at TIMESTAMPTZ columns
-- 3. ZERO Foreign Key constraints (REFERENCES) anywhere in the schema
-- 4. Dedicated audit_logs table storing previous_value and new_value as JSONB
-- 5. Full support for post-expiry thresholds, grace periods, and compounding penalties
-- ============================================================================

CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ============================================================================
-- 1. AUDIT LOGS TABLE
-- Records every insert, update, and delete with previous and new JSONB values.
-- ============================================================================
CREATE TABLE IF NOT EXISTS audit_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    entity_name VARCHAR(100) NOT NULL,            -- 'vehicles', 'vehicle_tax_compliances', 'tax_payment_logs'
    entity_id UUID NOT NULL,                      -- Logical UUID reference (NO foreign key constraint)
    action VARCHAR(20) NOT NULL,                  -- 'INSERT', 'UPDATE', 'DELETE'
    previous_value JSONB,                         -- Pre-mutation image (NULL on INSERT)
    new_value JSONB,                              -- Post-mutation image (NULL on DELETE)
    performed_by VARCHAR(100) DEFAULT 'system',
    ip_address VARCHAR(45),
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_audit_logs_entity ON audit_logs(entity_name, entity_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_created_at ON audit_logs(created_at DESC);

-- ============================================================================
-- 2. VEHICLE MASTER TABLE
-- Detailed asset records: Engine, Full Chassis, Chassis Last 5, Owner Info, Hypothecation.
-- ============================================================================
CREATE TABLE IF NOT EXISTS vehicles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    registration_number VARCHAR(20) NOT NULL,     -- e.g. 'TN-01-AX-4825'
    registration_date DATE NOT NULL,              -- Date of initial registration
    chassis_number VARCHAR(50) NOT NULL,          -- Full 17-digit Chassis / VIN
    chassis_last_5 VARCHAR(5) NOT NULL,           -- Crucial 5 digits for Vahan portal
    engine_number VARCHAR(50) NOT NULL,           -- Engine serial number
    vehicle_class VARCHAR(50) NOT NULL,           -- 'Heavy Goods Vehicle', 'Multi-Axle Truck', etc.
    make_model VARCHAR(100) NOT NULL,             -- e.g. 'Tata Signa 4825.TK'
    manufacturing_year INT NOT NULL,              -- Determines Green Tax eligibility (>8/15 yrs)
    manufacturing_month INT DEFAULT 1,            -- 1 to 12
    gross_vehicle_weight_kg INT NOT NULL,         -- GVW in kg (e.g. 47500)
    unladen_weight_kg INT,                        -- Tare weight in kg
    seating_capacity INT DEFAULT 2,
    fuel_type VARCHAR(30) DEFAULT 'DIESEL',       -- 'DIESEL', 'CNG', 'ELECTRIC', 'LNG'
    emission_norms VARCHAR(20) DEFAULT 'BS-VI',   -- 'BS-IV', 'BS-VI'
    body_type VARCHAR(50) DEFAULT 'Tipper',       -- 'Tipper', 'Container', 'Tanker', 'Trailer'
    color VARCHAR(30),
    state VARCHAR(50) NOT NULL,                   -- e.g. 'Tamil Nadu'
    rto_code VARCHAR(50) NOT NULL,                -- e.g. 'TN-01 (Chennai Central)'
    
    -- Registered Owner Details
    owner_name VARCHAR(150) NOT NULL,             -- Registered owner or company
    owner_father_or_rep_name VARCHAR(150),
    owner_phone VARCHAR(20) NOT NULL,             -- Primary mobile for WhatsApp / SMS notifications
    owner_email VARCHAR(100),
    owner_address TEXT,
    owner_pan_or_gst VARCHAR(30),
    
    -- Operational & Driver Details
    driver_name VARCHAR(100),
    driver_phone VARCHAR(20),
    driver_license_number VARCHAR(50),
    depot_or_division VARCHAR(100) DEFAULT 'Main Fleet',
    
    -- Hypothecation / Financial Loan Details
    is_hypothecated BOOLEAN DEFAULT FALSE,
    financier_name VARCHAR(150),                  -- Bank / NBFC (e.g. 'HDFC Bank Ltd')
    
    status VARCHAR(30) DEFAULT 'ACTIVE',          -- 'ACTIVE', 'MAINTENANCE', 'DECOMMISSIONED'
    notes TEXT,
    
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP NOT NULL
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_vehicles_reg_no ON vehicles(registration_number);
CREATE INDEX IF NOT EXISTS idx_vehicles_chassis_last_5 ON vehicles(chassis_last_5);

-- ============================================================================
-- 3. TAX & COMPLIANCE THRESHOLD CONFIGURATION TABLE
-- Stores pre-expiry and post-expiry thresholds, grace periods, and penalty rates.
-- ============================================================================
CREATE TABLE IF NOT EXISTS tax_threshold_configs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tax_code VARCHAR(50) NOT NULL,                -- 'MV_TAX', 'GREEN_TAX', 'INSURANCE', 'FITNESS', 'PERMIT', 'PUCC'
    tax_name VARCHAR(100) NOT NULL,               -- Display name
    description TEXT,
    default_frequency VARCHAR(30) NOT NULL,       -- 'QUARTERLY', 'HALF_YEARLY', 'ANNUAL', '5_YEARS', '6_MONTHS'
    
    -- Pre-Expiry Thresholds (Days before expiry to alert manager)
    pre_expiry_alert_days INT[] NOT NULL,         -- e.g. ARRAY[30, 15, 7, 3, 1, 0]
    
    -- Post-Expiry Thresholds (Days after expiry date)
    grace_period_days INT DEFAULT 0,              -- Grace period in days before strict penalty starts
    post_expiry_alert_days INT[] NOT NULL,        -- e.g. ARRAY[1, 3, 7, 15, 30, 60]
    
    -- Penalty & Statutory Calculation Rules
    penalty_type VARCHAR(30) DEFAULT 'PERCENTAGE_PER_MONTH', -- 'DAILY_FLAT', 'PERCENTAGE_PER_MONTH', 'SLAB'
    penalty_rate NUMERIC(10,2) DEFAULT 2.00,      -- e.g. 2.00% interest per month or ₹50/day
    late_fee_flat NUMERIC(10,2) DEFAULT 0.00,     -- Base late fine in ₹
    statutory_warning TEXT,                       -- Legal consequence warning text for SMS/WhatsApp
    
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP NOT NULL
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_tax_threshold_code ON tax_threshold_configs(tax_code);

-- ============================================================================
-- 4. VEHICLE TAX COMPLIANCES TABLE
-- Holds the live status, expiry dates, and specific thresholds for each vehicle.
-- NO foreign key constraint to vehicles.
-- ============================================================================
CREATE TABLE IF NOT EXISTS vehicle_tax_compliances (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    vehicle_id UUID NOT NULL,                     -- Logical reference to vehicles.id (NO foreign key)
    tax_code VARCHAR(50) NOT NULL,                -- 'MV_TAX', 'GREEN_TAX', 'INSURANCE', 'FITNESS', 'PERMIT', 'PUCC'
    is_enabled BOOLEAN DEFAULT TRUE,
    
    last_paid_date DATE,                          -- Date tax was last paid
    expiry_date DATE NOT NULL,                    -- Upcoming renewal date
    last_paid_amount NUMERIC(12,2) DEFAULT 0.00,  -- Last tax fee paid in INR (₹)
    receipt_number VARCHAR(100),                  -- Form 53/54 challan or policy number
    payment_mode VARCHAR(50) DEFAULT 'VAHAN_PORTAL',
    payment_frequency VARCHAR(30) DEFAULT 'QUARTERLY',
    
    -- Vehicle-Specific Threshold Overrides (Falls back to config if NULL)
    custom_grace_period_days INT,
    custom_pre_alert_days INT[],
    custom_post_alert_days INT[],
    
    -- Insurance-Specific Attributes
    insurance_policy_number VARCHAR(100),
    insurance_provider VARCHAR(150),
    insurance_type VARCHAR(50),                   -- 'Comprehensive', 'Third Party Liability'
    idv_value NUMERIC(12,2),
    
    -- Current Status
    status VARCHAR(30) NOT NULL DEFAULT 'VALID',  -- 'VALID', 'EXPIRING_SOON', 'DUE_TODAY', 'GRACE_PERIOD', 'OVERDUE'
    days_until_expiry INT,                        -- Computed delta in days (negative if expired)
    estimated_renewal_amount NUMERIC(12,2),
    estimated_penalty_amount NUMERIC(12,2) DEFAULT 0.00,
    
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_vtc_vehicle_id ON vehicle_tax_compliances(vehicle_id);
CREATE INDEX IF NOT EXISTS idx_vtc_tax_code ON vehicle_tax_compliances(tax_code);
CREATE INDEX IF NOT EXISTS idx_vtc_expiry_date ON vehicle_tax_compliances(expiry_date);
CREATE INDEX IF NOT EXISTS idx_vtc_status ON vehicle_tax_compliances(status);

-- ============================================================================
-- 5. TAX PAYMENT AUDIT & FINANCIAL LEDGER TABLE
-- Immutable historical ledger of all past tax payments across all dates.
-- NO foreign key constraint to vehicles.
-- ============================================================================
CREATE TABLE IF NOT EXISTS tax_payment_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    vehicle_id UUID NOT NULL,                     -- Logical reference (NO foreign key)
    vehicle_reg_no VARCHAR(20) NOT NULL,
    tax_code VARCHAR(50) NOT NULL,
    
    paid_date DATE NOT NULL,                      -- Date payment was executed
    period_from DATE NOT NULL,                    -- Tax validity start
    period_to DATE NOT NULL,                      -- Tax validity end
    base_tax_amount NUMERIC(12,2) NOT NULL,       -- Base road tax or fee in ₹
    green_tax_component NUMERIC(12,2) DEFAULT 0.00, -- Green tax component in ₹
    penalty_or_fine_amount NUMERIC(12,2) DEFAULT 0.00,
    total_amount_paid NUMERIC(12,2) NOT NULL,
    
    receipt_challan_no VARCHAR(100) NOT NULL,     -- Parivahan Form 54 receipt or challan no.
    transaction_ref_no VARCHAR(100),              -- Bank / Treasury ref
    payment_mode VARCHAR(50) NOT NULL,            -- 'VAHAN_PORTAL', 'TREASURY_CHALLAN', 'RTO_COUNTER', 'INSURER'
    notes TEXT,
    
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_tpl_vehicle_id ON tax_payment_logs(vehicle_id);
CREATE INDEX IF NOT EXISTS idx_tpl_paid_date ON tax_payment_logs(paid_date DESC);
CREATE INDEX IF NOT EXISTS idx_tpl_receipt_no ON tax_payment_logs(receipt_challan_no);

-- ============================================================================
-- 6. NOTIFICATION AUDIT LOGS TABLE
-- Records every autogenerated WhatsApp or SMS notification with delivery status.
-- NO foreign key constraint to vehicles.
-- ============================================================================
CREATE TABLE IF NOT EXISTS notification_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    vehicle_id UUID NOT NULL,                     -- Logical reference (NO foreign key)
    vehicle_reg_no VARCHAR(20) NOT NULL,
    tax_code VARCHAR(50) NOT NULL,
    
    channel VARCHAR(30) NOT NULL,                 -- 'WHATSAPP_CALLMEBOT', 'SMS_DEVICE_GATEWAY', 'WHATSAPP_DIRECT_LINK'
    recipient_phone VARCHAR(20) NOT NULL,
    recipient_name VARCHAR(100),
    
    trigger_type VARCHAR(30) NOT NULL,            -- 'PRE_EXPIRY', 'DUE_TODAY', 'POST_EXPIRY_GRACE', 'POST_EXPIRY_OVERDUE'
    days_delta INT NOT NULL,                      -- Negative = pre-expiry, 0 = today, Positive = post-expiry
    
    message_content TEXT NOT NULL,
    delivery_status VARCHAR(30) NOT NULL,         -- 'SENT', 'FAILED', 'QUEUED', 'DISPATCHED'
    gateway_response TEXT,
    
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_notif_vehicle_id ON notification_logs(vehicle_id);
CREATE INDEX IF NOT EXISTS idx_notif_created_at ON notification_logs(created_at DESC);

