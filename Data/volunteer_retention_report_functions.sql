-- Enable pg_trgm extension for fuzzy string matching
CREATE EXTENSION IF NOT EXISTS pg_trgm;

-- Function to find volunteers who worked on Crowd Management in past years
-- and show their 2025 assignments and aggregated past assignments,
-- using fuzzy logic for name matching when contact info is shared.
CREATE OR REPLACE FUNCTION public.get_crowd_management_retention_report(
    p_current_year INTEGER DEFAULT 2025,
    p_name_similarity_threshold REAL DEFAULT 1.0 -- Adjust as needed (0.0 to 1.0)
)
RETURNS TABLE (
    first_name TEXT,
    last_name TEXT,
    email TEXT,
    phone TEXT,
    current_year_seva TEXT,
    past_years_seva_details TEXT
)
LANGUAGE plpgsql
AS $$
BEGIN
    RETURN QUERY
    WITH PastCrowdMgmtVolunteersAggregated AS (
        SELECT
            TRIM(vdh.first_name) AS first_name,
            TRIM(vdh.last_name) AS last_name,
            vdh.email,
            vdh.phone,
            STRING_AGG(
                vdh.year::TEXT || ' "' || vdh.seva || '"',
                '; ' ORDER BY vdh.year
            ) AS past_years_seva_details
        FROM
            public.volunteer_data_historical vdh
        WHERE
            (vdh.seva ILIKE 'Crowd%' OR vdh.seva ILIKE 'Crwd%')
            AND vdh.year < p_current_year
        GROUP BY
            TRIM(vdh.first_name), TRIM(vdh.last_name), vdh.email, vdh.phone
    ),
    CurrentYearAssignments AS (
        SELECT
            TRIM(vdh.first_name) AS first_name,
            TRIM(vdh.last_name) AS last_name,
            vdh.email,
            vdh.phone,
            vdh.seva AS current_seva_category
        FROM
            public.volunteer_data_historical vdh
        WHERE
            vdh.year = p_current_year
    )
    SELECT
        pc.first_name,
        pc.last_name,
        pc.email,
        pc.phone,
        cc.current_seva_category AS current_year_seva,
        pc.past_years_seva_details
    FROM
        PastCrowdMgmtVolunteersAggregated pc
    LEFT JOIN
        CurrentYearAssignments cc ON
            (pc.email = cc.email OR pc.phone = cc.phone)
            AND (
                similarity(pc.first_name, cc.first_name) >= p_name_similarity_threshold AND
                similarity(pc.last_name, cc.last_name) >= p_name_similarity_threshold
            )
    ;
END;
$$;
