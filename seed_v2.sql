-- =============================================================================
-- seed_v2.sql  —  Extended seed data for v2 schema
-- Source policy: Official university websites only
-- Missing values → NULL (never fabricated)
-- Generated: 2026-06-25
-- =============================================================================
-- NOTE: This file EXTENDS the original seed.sql.
-- Run original seed.sql first, then run this file.
-- University IDs assume the original INSERT order (1–18).
-- =============================================================================

-- ---------------------------------------------------------------------------
-- UPDATE universities with new v2 columns
-- (slug, city, province, hec_status, is_active)
-- ---------------------------------------------------------------------------
UPDATE universities SET slug='ssuet-karachi',         city='Karachi',   province='Sindh',        hec_status=NULL,        charter_authority=NULL                      WHERE university_id=1;
UPDATE universities SET slug='habib-university',       city='Karachi',   province='Sindh',        hec_status=NULL,        charter_authority=NULL                      WHERE university_id=2;
UPDATE universities SET slug='iba-karachi',            city='Karachi',   province='Sindh',        hec_status=NULL,        charter_authority='Government of Sindh'      WHERE university_id=3;
UPDATE universities SET slug='dha-suffa-university',   city='Karachi',   province='Sindh',        hec_status=NULL,        charter_authority=NULL                      WHERE university_id=4;
UPDATE universities SET slug='iqra-university',        city='Karachi',   province='Sindh',        hec_status=NULL,        charter_authority=NULL                      WHERE university_id=5;
UPDATE universities SET slug='maju-karachi',           city='Karachi',   province='Sindh',        hec_status='Chartered', charter_authority='Government of Sindh'      WHERE university_id=6;
UPDATE universities SET slug='uok-karachi',            city='Karachi',   province='Sindh',        hec_status=NULL,        charter_authority='Government of Sindh'      WHERE university_id=7;
UPDATE universities SET slug='neduet-karachi',         city='Karachi',   province='Sindh',        hec_status='W Category',charter_authority='Government of Sindh'      WHERE university_id=8;
UPDATE universities SET slug='bahria-karachi',         city='Karachi',   province='Sindh',        hec_status='Chartered', charter_authority='Pakistan Navy / Federal'   WHERE university_id=9;
UPDATE universities SET slug='hamdard-university',     city='Karachi',   province='Sindh',        hec_status=NULL,        charter_authority=NULL                      WHERE university_id=10;
UPDATE universities SET slug='ziauddin-university',    city='Karachi',   province='Sindh',        hec_status='Recognised',charter_authority=NULL                      WHERE university_id=11;
UPDATE universities SET slug='indus-university',       city='Karachi',   province='Sindh',        hec_status=NULL,        charter_authority=NULL                      WHERE university_id=12;
UPDATE universities SET slug='szabist-karachi',        city='Karachi',   province='Sindh',        hec_status=NULL,        charter_authority=NULL                      WHERE university_id=13;
UPDATE universities SET slug='iobm-karachi',           city='Karachi',   province='Sindh',        hec_status=NULL,        charter_authority=NULL                      WHERE university_id=14;
UPDATE universities SET slug='duet-karachi',           city='Karachi',   province='Sindh',        hec_status='Chartered', charter_authority='Government of Sindh'      WHERE university_id=15;
UPDATE universities SET slug='fast-nuces-karachi',     city='Karachi',   province='Sindh',        hec_status='Chartered', charter_authority='Federal Government'       WHERE university_id=16;
UPDATE universities SET slug='comsats-university',     city='Islamabad', province='Islamabad Capital Territory', hec_status='Chartered', charter_authority='Federal Government' WHERE university_id=17;
UPDATE universities SET slug='pieas-islamabad',        city='Islamabad', province='Islamabad Capital Territory', hec_status='Ranked #1 Engineering & Technology', charter_authority='Federal Government / PAEC' WHERE university_id=18;

-- ---------------------------------------------------------------------------
-- RANKINGS  (sourced from official websites text only — no fabrication)
-- ---------------------------------------------------------------------------
INSERT INTO rankings (university_id, ranking_name, ranking_category, ranking_value, ranking_year, ranking_note, source_urls) VALUES
(5,  'Times Higher Education',        'THE',          NULL, NULL, 'Ranking shown on official site; exact position not disclosed', '["https://iqra.edu.pk/"]'),
(5,  'UI GreenMetric',                'International', NULL, NULL, 'UI GreenMetric ranking referenced on official site',          '["https://iqra.edu.pk/"]'),
(8,  'HEC National Ranking',          'HEC',          '95.33% score', NULL, 'Score shown on official NED website',                '["https://www.neduet.edu.pk/"]'),
(8,  'QEC Category',                  'HEC',          'W Category',   NULL, 'QEC W Category mentioned on official site',           '["https://www.neduet.edu.pk/"]'),
(8,  'ISO 9001:2015',                 'Other',        'Certified',    NULL, 'ISO certification stated on official site',           '["https://www.neduet.edu.pk/"]'),
(18, 'HEC Engineering & Technology',  'HEC',          'Ranked #1',    NULL, 'Stated as No. 1 for Engineering & Technology on official site', '["https://www.pieas.edu.pk/"]');

-- ---------------------------------------------------------------------------
-- IMPORTANT LINKS  (official portals and sub-pages)
-- ---------------------------------------------------------------------------
INSERT INTO important_links (university_id, link_label, url, link_category) VALUES
-- SSUET
(1,  'Official Website',        'https://www.ssuet.edu.pk/',                           'General'),
(1,  'Admissions Portal',       'https://edusmartz.ssuet.edu.pk/AdmissionPortal/Signin','Admissions'),
(1,  'About Us',                'https://www.ssuet.edu.pk/about-us/',                  'General'),
-- HU
(2,  'Official Website',        'https://habib.edu.pk/',                               'General'),
(2,  'Admissions Portal',       'https://eapplication.habib.edu.pk/',                  'Admissions'),
(2,  'Admissions Info',         'https://habib.edu.pk/admissions/',                    'Admissions'),
-- IBA
(3,  'Official Website',        'https://iba.edu.pk/',                                 'General'),
(3,  'Online Admissions',       'https://onlineadmission.iba.edu.pk/',                 'Admissions'),
(3,  'Fee Structure',           'https://iba.edu.pk/fee-structure.php',                'Fees'),
(3,  'Financial Assistance',    'https://iba.edu.pk/financialassistance/',             'Scholarships'),
-- DSU
(4,  'Official Website',        'https://www.dsu.edu.pk/',                             'General'),
(4,  'Admissions Portal',       'https://erp.dsu.edu.pk/web/signin/',                  'Admissions'),
(4,  'Admission Info',          'https://www.dsu.edu.pk/admission-info/',              'Admissions'),
-- Iqra
(5,  'Official Website',        'https://iqra.edu.pk/',                               'General'),
(5,  'Admissions Portal',       'https://admissions.iqra.edu.pk/',                    'Admissions'),
(5,  'Campuses',                'https://iqra.edu.pk/campuses/',                       'Campuses'),
-- MAJU
(6,  'Official Website',        'https://jinnah.edu/',                                'General'),
(6,  'Admissions Portal',       'https://admissions.jinnah.edu/',                     'Admissions'),
(6,  'Fee & Scholarship',       'https://jinnah.edu/fee-structure-scholarship/',       'Fees'),
-- UoK
(7,  'Official Website',        'https://uok.edu.pk/',                                'General'),
(7,  'Admissions',              'https://uok.edu.pk/admissions/index.php',            'Admissions'),
(7,  'Scholarships',            'https://uok.edu.pk/sfao/scholarships.php',           'Scholarships'),
-- NEDUET
(8,  'Official Website',        'https://www.neduet.edu.pk/',                         'General'),
(8,  'UG Admissions Portal',    'https://ugadmissions.neduet.edu.pk/',                'Admissions'),
(8,  'Scholarships',            'https://www.neduet.edu.pk/scholarships-NED',         'Scholarships'),
-- Bahria
(9,  'Official Website',        'https://www.bahria.edu.pk/',                         'General'),
(9,  'Karachi Campus',          'https://www.bahria.edu.pk/home/campus?campus=karachi','Campuses'),
(9,  'Admissions',              'https://www.bahria.edu.pk/home/index#admissions_page','Admissions'),
-- Hamdard
(10, 'Official Website',        'https://hamdard.edu.pk/',                            'General'),
-- ZU
(11, 'Official Website',        'https://zu.edu.pk/',                                 'General'),
(11, 'Admissions Portal',       'https://admission.zu.edu.pk/',                       'Admissions'),
(11, 'Locations',               'https://zu.edu.pk/locations/',                       'Campuses'),
-- Indus
(12, 'Official Website',        'https://indus.edu.pk/',                              'General'),
(12, 'Courses',                 'https://indus.edu.pk/course.php',                    'Programs'),
(12, 'Fee Structure',           'https://indus.edu.pk/fee.php',                       'Fees'),
(12, 'Admissions Portal',       'http://inquiry.induscms.com:81/ords/r/erasoft/a200/login','Admissions'),
-- SZABIST
(13, 'Official Website',        'https://szabist.edu.pk/',                            'General'),
(13, 'Admissions Portal',       'http://admissions.szabist.edu.pk/',                  'Admissions'),
(13, 'Fee Structure',           'https://szabist.edu.pk/fee-structure/',              'Fees'),
-- IoBM
(14, 'Official Website',        'https://iobm.edu.pk/',                               'General'),
(14, 'Career Development Centre','https://iobm.edu.pk/career-development-centre/',    'Career'),
-- DUET
(15, 'Official Website',        'https://duet.edu.pk/',                               'General'),
(15, 'Admissions Portal',       'http://admissions.duet.edu.pk/',                     'Admissions'),
(15, 'Undergraduate Programs',  'https://duet.edu.pk/undergrad-programs/',            'Programs'),
-- FAST
(16, 'Official Website',        'https://nu.edu.pk/',                                 'General'),
(16, 'Karachi Campus Site',     'https://khi.nu.edu.pk/',                             'Campuses'),
(16, 'Admissions Portal',       'https://admissions.nu.edu.pk/OLAR/Login',            'Admissions'),
-- COMSATS
(17, 'Official Website',        'https://comsats.edu.pk/',                            'General'),
(17, 'Admissions Portal',       'https://admissions.comsats.edu.pk/',                 'Admissions'),
(17, 'Fee Structure',           'https://comsats.edu.pk/fee-structure.aspx',          'Fees'),
-- PIEAS
(18, 'Official Website',        'https://www.pieas.edu.pk/',                          'General'),
(18, 'Admissions Portal',       'http://admissions.pieas.edu.pk/',                    'Admissions'),
(18, 'Scholarships',            'https://www.pieas.edu.pk/scholarships/',             'Scholarships');

-- ---------------------------------------------------------------------------
-- SCRAPING TARGETS  (Phase 4 — priority targets for data collection)
-- ---------------------------------------------------------------------------
INSERT INTO scraping_targets (university_id, target_url, data_type, priority_score, scrape_status, data_completeness_pct) VALUES
-- SSUET
(1, 'https://www.ssuet.edu.pk/', 'General Info', 8, 'Pending', 20.0),
(1, 'https://edusmartz.ssuet.edu.pk/AdmissionPortal/Signin', 'Admissions', 9, 'Pending', 5.0),
(1, 'https://www.ssuet.edu.pk/about-us/', 'History & Overview', 7, 'Pending', 10.0),
-- HU
(2, 'https://habib.edu.pk/', 'General Info', 8, 'Pending', 20.0),
(2, 'https://habib.edu.pk/admissions/', 'Admissions', 9, 'Pending', 5.0),
(2, 'https://eapplication.habib.edu.pk/', 'Admissions Portal', 8, 'Pending', 5.0),
-- IBA
(3, 'https://iba.edu.pk/', 'General Info', 9, 'Pending', 30.0),
(3, 'https://onlineadmission.iba.edu.pk/', 'Admissions', 10, 'Pending', 10.0),
(3, 'https://iba.edu.pk/fee-structure.php', 'Fees', 10, 'Pending', 5.0),
(3, 'https://iba.edu.pk/financialassistance/', 'Scholarships', 9, 'Pending', 5.0),
-- DSU
(4, 'https://www.dsu.edu.pk/', 'General Info', 7, 'Pending', 20.0),
(4, 'https://www.dsu.edu.pk/admission-info/', 'Admissions', 8, 'Pending', 5.0),
-- Iqra
(5, 'https://iqra.edu.pk/', 'General Info', 7, 'Pending', 25.0),
(5, 'https://admissions.iqra.edu.pk/', 'Admissions', 8, 'Pending', 5.0),
(5, 'https://iqra.edu.pk/campuses/', 'Campuses', 7, 'Pending', 30.0),
-- MAJU
(6, 'https://jinnah.edu/', 'General Info', 7, 'Pending', 30.0),
(6, 'https://admissions.jinnah.edu/', 'Admissions', 8, 'Pending', 5.0),
(6, 'https://jinnah.edu/fee-structure-scholarship/', 'Fees & Scholarships', 9, 'Pending', 5.0),
-- UoK
(7, 'https://uok.edu.pk/', 'General Info', 8, 'Pending', 25.0),
(7, 'https://uok.edu.pk/admissions/index.php', 'Admissions', 9, 'Pending', 5.0),
(7, 'https://uok.edu.pk/sfao/scholarships.php', 'Scholarships', 8, 'Pending', 5.0),
-- NEDUET
(8, 'https://www.neduet.edu.pk/', 'General Info', 9, 'Pending', 35.0),
(8, 'https://ugadmissions.neduet.edu.pk/', 'Admissions', 10, 'Pending', 10.0),
(8, 'https://www.neduet.edu.pk/scholarships-NED', 'Scholarships', 9, 'Pending', 5.0),
-- Bahria
(9, 'https://www.bahria.edu.pk/', 'General Info', 8, 'Pending', 30.0),
(9, 'https://www.bahria.edu.pk/home/campus?campus=karachi', 'Campus Info', 7, 'Pending', 15.0),
(9, 'https://www.bahria.edu.pk/home/index#admissions_page', 'Admissions', 9, 'Pending', 5.0),
-- Hamdard
(10, 'https://hamdard.edu.pk/', 'General Info', 6, 'Pending', 10.0),
-- ZU
(11, 'https://zu.edu.pk/', 'General Info', 8, 'Pending', 25.0),
(11, 'https://admission.zu.edu.pk/', 'Admissions', 9, 'Pending', 5.0),
(11, 'https://zu.edu.pk/locations/', 'Campuses', 7, 'Pending', 15.0),
-- Indus
(12, 'https://indus.edu.pk/', 'General Info', 6, 'Pending', 20.0),
(12, 'https://indus.edu.pk/course.php', 'Programs', 7, 'Pending', 5.0),
(12, 'https://indus.edu.pk/fee.php', 'Fees', 8, 'Pending', 5.0),
-- SZABIST
(13, 'https://szabist.edu.pk/', 'General Info', 8, 'Pending', 25.0),
(13, 'http://admissions.szabist.edu.pk/', 'Admissions', 9, 'Pending', 5.0),
(13, 'https://szabist.edu.pk/fee-structure/', 'Fees', 9, 'Pending', 5.0),
-- IoBM
(14, 'https://iobm.edu.pk/', 'General Info', 7, 'Pending', 20.0),
(14, 'https://iobm.edu.pk/career-development-centre/', 'Career', 6, 'Pending', 10.0),
-- DUET
(15, 'https://duet.edu.pk/', 'General Info', 7, 'Pending', 30.0),
(15, 'http://admissions.duet.edu.pk/', 'Admissions', 8, 'Pending', 5.0),
(15, 'https://duet.edu.pk/undergrad-programs/', 'Programs', 8, 'Pending', 10.0),
-- FAST
(16, 'https://nu.edu.pk/', 'General Info', 9, 'Pending', 35.0),
(16, 'https://khi.nu.edu.pk/', 'Karachi Campus Info', 8, 'Pending', 20.0),
(16, 'https://admissions.nu.edu.pk/OLAR/Login', 'Admissions', 10, 'Pending', 5.0),
-- COMSATS
(17, 'https://comsats.edu.pk/', 'General Info', 8, 'Pending', 30.0),
(17, 'https://admissions.comsats.edu.pk/', 'Admissions', 9, 'Pending', 5.0),
(17, 'https://comsats.edu.pk/fee-structure.aspx', 'Fees', 9, 'Pending', 5.0),
-- PIEAS
(18, 'https://www.pieas.edu.pk/', 'General Info', 10, 'Pending', 35.0),
(18, 'http://admissions.pieas.edu.pk/', 'Admissions', 10, 'Pending', 5.0),
(18, 'https://www.pieas.edu.pk/scholarships/', 'Scholarships', 9, 'Pending', 5.0);

-- ---------------------------------------------------------------------------
-- DATA COLLECTION CHECKLIST  (Phase 4 — per university, per field group)
-- ---------------------------------------------------------------------------
INSERT INTO data_collection_checklist (university_id, field_group, field_name, is_collected, collected_value, notes)
SELECT u.university_id, f.field_group, f.field_name, FALSE, NULL, 'Awaiting official source scrape'
FROM universities u
CROSS JOIN (VALUES
  ('Basic Information',    'logo_url'),
  ('Basic Information',    'phone'),
  ('Basic Information',    'email'),
  ('Basic Information',    'postal_code'),
  ('Basic Information',    'coordinates'),
  ('Basic Information',    'year_established'),
  ('Basic Information',    'charter_authority'),
  ('Basic Information',    'hec_status'),
  ('University Overview',  'history'),
  ('University Overview',  'mission'),
  ('University Overview',  'vision'),
  ('University Overview',  'reputation_note'),
  ('University Overview',  'major_strengths'),
  ('University Overview',  'national_ranking'),
  ('Campuses',             'campus_name'),
  ('Campuses',             'campus_address'),
  ('Campuses',             'campus_size_acres'),
  ('Campuses',             'virtual_tour_url'),
  ('Campuses',             'campus_facilities'),
  ('Programs',             'program_name'),
  ('Programs',             'degree_type'),
  ('Programs',             'duration_years'),
  ('Programs',             'credit_hours'),
  ('Programs',             'total_seats'),
  ('Programs',             'merit_requirement'),
  ('Programs',             'eligibility_criteria'),
  ('Admissions',           'admission_cycle'),
  ('Admissions',           'application_deadline'),
  ('Admissions',           'required_documents'),
  ('Admissions',           'merit_calculation_method'),
  ('Admissions',           'entry_test_required'),
  ('Entry Tests',          'test_name'),
  ('Entry Tests',          'subjects_included'),
  ('Entry Tests',          'marks_distribution'),
  ('Entry Tests',          'passing_criteria'),
  ('Fees',                 'admission_fee'),
  ('Fees',                 'semester_fee'),
  ('Fees',                 'credit_hour_fee'),
  ('Fees',                 'hostel_fee'),
  ('Fees',                 'transport_fee'),
  ('Fees',                 'total_degree_cost'),
  ('Scholarships',         'scholarship_name'),
  ('Scholarships',         'scholarship_type'),
  ('Scholarships',         'eligibility'),
  ('Scholarships',         'coverage_percentage'),
  ('Academic Policies',    'min_cgpa'),
  ('Academic Policies',    'min_attendance_pct'),
  ('Academic Policies',    'probation_cgpa'),
  ('Academic Policies',    'graduation_min_cgpa'),
  ('Faculty & Academics',  'total_faculty_count'),
  ('Faculty & Academics',  'phd_faculty_count'),
  ('Faculty & Academics',  'student_faculty_ratio'),
  ('Faculty & Academics',  'lab_facilities'),
  ('Student Life',         'clubs'),
  ('Student Life',         'societies'),
  ('Student Life',         'annual_events'),
  ('Student Life',         'sports_available'),
  ('Facilities',           'library'),
  ('Facilities',           'cafeteria'),
  ('Facilities',           'mosque'),
  ('Facilities',           'medical_center'),
  ('Facilities',           'sports_complex'),
  ('Facilities',           'wifi'),
  ('Facilities',           'parking'),
  ('Hostel',               'hostel_availability'),
  ('Hostel',               'boys_capacity'),
  ('Hostel',               'girls_capacity'),
  ('Hostel',               'monthly_fee_pkr'),
  ('Hostel',               'meals_included'),
  ('Transport',            'transport_available'),
  ('Transport',            'routes'),
  ('Transport',            'monthly_fee_pkr'),
  ('Career & Placement',   'career_services_office'),
  ('Career & Placement',   'placement_rate_pct'),
  ('Career & Placement',   'top_recruiters'),
  ('Career & Placement',   'alumni_network'),
  ('Career Paths',         'career_paths_per_program'),
  ('Career Paths',         'expected_salary_range'),
  ('Reviews',              'pros'),
  ('Reviews',              'cons'),
  ('Reviews',              'rating_overall'),
  ('FAQs',                 'faqs_populated'),
  ('Social Media',         'facebook_url'),
  ('Social Media',         'linkedin_url'),
  ('Social Media',         'youtube_url')
) AS f(field_group, field_name);

-- =============================================================================
-- END OF seed_v2.sql
-- =============================================================================
