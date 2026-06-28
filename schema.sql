-- PostgreSQL schema for Pakistani university profiles
-- Source policy: official university websites and official admissions portals only

CREATE TABLE universities (
    university_id BIGSERIAL PRIMARY KEY,
    name TEXT NOT NULL,
    short_name TEXT,
    official_website TEXT,
    admissions_portal TEXT,
    location TEXT,
    year_established TEXT,
    hec_recognition TEXT,
    accreditation TEXT,
    university_type TEXT,
    source_note TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE campuses (
    campus_id BIGSERIAL PRIMARY KEY,
    university_id BIGINT NOT NULL REFERENCES universities(university_id) ON DELETE CASCADE,
    campus_name TEXT NOT NULL,
    location TEXT,
    campus_type TEXT,
    source_urls JSONB,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE programs (
    program_id BIGSERIAL PRIMARY KEY,
    university_id BIGINT NOT NULL REFERENCES universities(university_id) ON DELETE CASCADE,
    campus_id BIGINT REFERENCES campuses(campus_id) ON DELETE SET NULL,
    program_name TEXT NOT NULL,
    degree_type TEXT,
    duration TEXT,
    approx_merit_requirement TEXT,
    eligibility_criteria TEXT,
    open_merit_self_finance TEXT,
    total_seats TEXT,
    source_urls JSONB,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE admissions (
    admission_id BIGSERIAL PRIMARY KEY,
    university_id BIGINT NOT NULL REFERENCES universities(university_id) ON DELETE CASCADE,
    admission_cycle TEXT,
    admission_months TEXT,
    eligibility_criteria TEXT,
    required_documents TEXT,
    admission_process TEXT,
    merit_calculation_method TEXT,
    interview_requirement TEXT,
    source_urls JSONB,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE entry_tests (
    entry_test_id BIGSERIAL PRIMARY KEY,
    university_id BIGINT NOT NULL REFERENCES universities(university_id) ON DELETE CASCADE,
    test_name TEXT,
    test_type TEXT,
    subjects_included TEXT,
    marks_distribution TEXT,
    passing_criteria TEXT,
    sample_pattern TEXT,
    preparation_tips TEXT,
    source_urls JSONB,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE fees (
    fee_id BIGSERIAL PRIMARY KEY,
    university_id BIGINT NOT NULL REFERENCES universities(university_id) ON DELETE CASCADE,
    program_name TEXT,
    admission_fee TEXT,
    semester_fee TEXT,
    credit_hour_fee TEXT,
    hostel_fee TEXT,
    transport_fee TEXT,
    security_deposit TEXT,
    approx_total_degree_cost TEXT,
    source_urls JSONB,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE scholarships (
    scholarship_id BIGSERIAL PRIMARY KEY,
    university_id BIGINT NOT NULL REFERENCES universities(university_id) ON DELETE CASCADE,
    scholarship_name TEXT,
    scholarship_type TEXT,
    eligibility TEXT,
    coverage_percentage TEXT,
    source_urls JSONB,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE faculty (
    faculty_id BIGSERIAL PRIMARY KEY,
    university_id BIGINT NOT NULL REFERENCES universities(university_id) ON DELETE CASCADE,
    faculty_quality TEXT,
    qualification_levels TEXT,
    research_culture TEXT,
    lab_facilities TEXT,
    industry_exposure TEXT,
    internship_support TEXT,
    final_year_project_culture TEXT,
    source_urls JSONB,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE facilities (
    facility_id BIGSERIAL PRIMARY KEY,
    university_id BIGINT NOT NULL REFERENCES universities(university_id) ON DELETE CASCADE,
    facility_name TEXT NOT NULL,
    facility_value TEXT,
    source_urls JSONB,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE hostels (
    hostel_id BIGSERIAL PRIMARY KEY,
    university_id BIGINT NOT NULL REFERENCES universities(university_id) ON DELETE CASCADE,
    hostel_availability TEXT,
    hostel_quality TEXT,
    separate_hostels TEXT,
    source_urls JSONB,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE transport (
    transport_id BIGSERIAL PRIMARY KEY,
    university_id BIGINT NOT NULL REFERENCES universities(university_id) ON DELETE CASCADE,
    transport_availability TEXT,
    routes TEXT,
    source_urls JSONB,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE policies (
    policy_id BIGSERIAL PRIMARY KEY,
    university_id BIGINT NOT NULL REFERENCES universities(university_id) ON DELETE CASCADE,
    policy_name TEXT NOT NULL,
    policy_value TEXT,
    source_urls JSONB,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE placements (
    placement_id BIGSERIAL PRIMARY KEY,
    university_id BIGINT NOT NULL REFERENCES universities(university_id) ON DELETE CASCADE,
    career_services_office TEXT,
    internship_opportunities TEXT,
    placement_support TEXT,
    industry_partnerships TEXT,
    alumni_network TEXT,
    top_recruiters TEXT,
    source_urls JSONB,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE career_paths (
    career_path_id BIGSERIAL PRIMARY KEY,
    university_id BIGINT NOT NULL REFERENCES universities(university_id) ON DELETE CASCADE,
    program_name TEXT,
    career_paths TEXT,
    industries TEXT,
    government_opportunities TEXT,
    private_sector_opportunities TEXT,
    freelancing_opportunities TEXT,
    higher_education_options TEXT,
    expected_salary_range_pakistan TEXT,
    source_urls JSONB,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE rankings (
    ranking_id BIGSERIAL PRIMARY KEY,
    university_id BIGINT NOT NULL REFERENCES universities(university_id) ON DELETE CASCADE,
    ranking_name TEXT,
    ranking_value TEXT,
    ranking_note TEXT,
    source_urls JSONB,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE reviews (
    review_id BIGSERIAL PRIMARY KEY,
    university_id BIGINT NOT NULL REFERENCES universities(university_id) ON DELETE CASCADE,
    positive_experiences TEXT,
    common_complaints TEXT,
    faculty_feedback TEXT,
    campus_culture_feedback TEXT,
    source_urls JSONB,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE faqs (
    faq_id BIGSERIAL PRIMARY KEY,
    university_id BIGINT NOT NULL REFERENCES universities(university_id) ON DELETE CASCADE,
    question TEXT NOT NULL,
    answer TEXT,
    source_urls JSONB,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE links (
    link_id BIGSERIAL PRIMARY KEY,
    university_id BIGINT NOT NULL REFERENCES universities(university_id) ON DELETE CASCADE,
    link_label TEXT NOT NULL,
    url TEXT NOT NULL,
    source_urls JSONB,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_campuses_university_id ON campuses(university_id);
CREATE INDEX idx_programs_university_id ON programs(university_id);
CREATE INDEX idx_admissions_university_id ON admissions(university_id);
CREATE INDEX idx_fees_university_id ON fees(university_id);
CREATE INDEX idx_scholarships_university_id ON scholarships(university_id);
CREATE INDEX idx_faculty_university_id ON faculty(university_id);
CREATE INDEX idx_facilities_university_id ON facilities(university_id);
CREATE INDEX idx_hostels_university_id ON hostels(university_id);
CREATE INDEX idx_transport_university_id ON transport(university_id);
CREATE INDEX idx_policies_university_id ON policies(university_id);
CREATE INDEX idx_placements_university_id ON placements(university_id);
CREATE INDEX idx_rankings_university_id ON rankings(university_id);
CREATE INDEX idx_reviews_university_id ON reviews(university_id);
CREATE INDEX idx_faqs_university_id ON faqs(university_id);
CREATE INDEX idx_links_university_id ON links(university_id);
