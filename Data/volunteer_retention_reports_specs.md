# Volunteer Retention Report - Simplified Requirements

## Function

`get_crowd_management_retention_report(p_current_year, p_name_similarity_threshold, p_email_similarity_threshold, p_seva_patterns)`

## Generic Matching Rules (All Reports)

- **Primary**: email match (case-insensitive) based on threshold parameter
- **Secondary**: Exact phone match (normalized: remove spaces, dots, dashes, plus) [*Updated point*]
- **Name matching**: Fuzzy similarity only for assignment joins (not identification)
- **Seva param**: If the Seva filter has been passed then it should use them based on the specific requirement for current year volunteers list AND/OR for prior year requirements [*Added point*]
- **Seva param blank**: If the Seva filter has been blank then it should all volunteers list from current year and compare with all volunteers from prior year. i.e. both list shouldn't filter by any seva patters [*Added point*]
- **Current Year param**: Current year volunteers list should be fetched for selected year and prior year volunteers should be fetched prior to selected year. Default current year 2025. [*Added point*]

## Generic requirements

- **Code reuse**: Re-use code as much as possible [*Added point*]
- **NULL Values**: NULL values should be handled to prevent any issue [*Added point*]
- **Test automation**: Create/Update automated test scripts to cover all scenarios [*Added point*]

## Report 1: 'returning' Volunteers

**Requirements**:

- Shows ONLY volunteers who had worked in specified seva patterns (p_seva_patterns) in previous year(s) [*Updated point*]
- Volunteering in current year (using p_current_year) with Seva set to either assigned OR unassigned OR NULL but assigned to specified seva patterns. In otherwords must include unassigned volunteers who are registered in current year AND assigned to the specified seva patterns () in this prior years
- Must exclude volunteers still doing same seva category
- Expected: ~100+ rows for crowd management patterns (e.g. ARRAY['Crowd%', 'Crwd%'])
  **Example output**
  first_name,last_name,email,phone,current_year_seva,total,past_years_seva_details,volunteer_type
  Narendra,Pothineni,rn.pothineni@gmail.com,8475025885,CUTX Venue Setup Team,8,"2023 ""Crowd Mgmt""; 2024 ""Crowd Mgmt""",returning
  Prem,Kumar,premkavi@msn.com,9729220021,Annadanam,4,"2023 ""Crowd Mgmt""",returning
  test_fn,test_ln,test1@test.com,2345678901,,9,"2023 ""Crowd Mgmt""",returning
  test_fn2,test_ln2,test2@test.com,3456789012,,8,"2023 ""Crowd Mgmt""; 2024 ""Annadanam""",returning

## Report 2: 'new' Volunteers

**Requirements**:

- Current year volunteers with no past history in any year < p_current_year [*Updated point*]
- Use Generic Matching Rules for identification [*Updated point*]
- Expected: Good number of rows (not 0)

**Example output**
first_name,last_name,email,phone,current_year_seva,total,past_years_seva_details,volunteer_type
test_fn3,test_ln3,test4@test.com,4567890123,Unassigned,5,,new
test_fn4,test_ln4,test4@test.com,5678901234,Annadanam,8,,new

## Report 3: 'inactive' Volunteers

**Requirements**:

- Past volunteers any seva category if p_seva_patterns is not passed. Volunteers assigned specific seva based on p_seva_patterns in the past year(s) [*Updated point*]
- Not volunteering at all in current year i.e. No current year record
- Expected: Reasonable number but not all past volunteers

**Example output**
first_name,last_name,email,phone,current_year_seva,total,past_years_seva_details,volunteer_type
test_fn5,test_ln5,test5@test.com,6789012345,,,"2023 ""Crowd Mgmt""",inactive
test_fn6,test_ln6,test6@test.com,7890123456,,,"2023 ""Crowd Mgmt""; 2024 ""Annadanam""",inactive

## SQL Table Definition
CREATE TABLE public.volunteer_data_historical (
    id uuid NOT NULL DEFAULT gen_random_uuid(),
    created_at timestamp with time zone NOT NULL DEFAULT now(),
    updated_at timestamp with time zone NOT NULL DEFAULT now(),
    seva text NULL,
    email text NOT NULL,
    first_name text NULL,
    last_name text NULL,
    phone text NULL,
    center text NULL,
    region text NULL,
    association text NULL,
    gender text NULL,
    total integer NULL,
    year integer NOT NULL,
    "Batch" text NULL,
    CONSTRAINT volunteer_data_pkey PRIMARY KEY (id)
);

## Default Parameters

- `p_seva_patterns` default should be `['%']` (all categories, not just crowd management)
