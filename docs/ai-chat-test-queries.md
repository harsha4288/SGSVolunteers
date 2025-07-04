# AI Chat Test Queries

This document contains comprehensive test queries for the AI Chat functionality to help with testing and validation.

## T-Shirt Inventory Queries

### Basic Inventory Questions
- "How many large T-shirts are left?"
- "What's the stock for M size t-shirts?"
- "Do we have any XL shirts available?"
- "Show me all t-shirt inventory"
- "What sizes are available?"

### Edge Cases
- "How many XXXL shirts do we have?" (should handle non-existent sizes)
- "T-shirt count for size 2xl"
- "Show me t-shirt stock"

## Volunteer Statistics Queries

### General Volunteer Counts
- "How many volunteers do we have?"
- "Give me volunteer count by seva category"
- "Show me volunteer statistics"
- "How many volunteers are registered?"

### Seva Category Specific
- "How many volunteers are in Registration seva?"
- "List volunteers in Food Service"
- "Who are the volunteers in Logistics?"
- "Show me volunteers assigned to Media seva"

### GM Family Filtering
- "How many volunteers are from GM family?"
- "List GM family volunteers"
- "Non-GM family volunteer count"

### Student Batch Filtering
- "How many volunteers are from batch 2023?"
- "List volunteers from batch 2024"
- "Show me batch 2022 volunteers"

### Combined Filters
- "How many GM family volunteers are in Registration?"
- "List batch 2023 volunteers in Food Service"

## Check-in Statistics Queries

### Date-based Queries
- "How many volunteers checked in today?"
- "Who checked in yesterday?"
- "Show me check-ins for today"
- "Check-in count for yesterday"
- "How many check-ins on 2025-07-04?"

### Volunteer-specific Queries
- "Check-in status for John Smith"
- "When did Sarah Johnson check in?"
- "Show me check-ins for Amit Patel"

### General Check-in Stats
- "How many total check-ins do we have?"
- "Show me recent check-ins"
- "Total check-in count"

## Unrecognized Queries (Should gracefully handle)
- "What's the weather like?"
- "How do I cook pasta?"
- "What is the meaning of life?"
- "Tell me a joke"
- "What's 2+2?"

## Complex/Edge Case Queries
- "How many volunteers checked in today and are from GM family?"
- "Show me t-shirt inventory and volunteer count"
- "Who are the volunteers that haven't checked in?"
- "What's the most popular t-shirt size?"

## API Testing Examples

### Using cURL
```bash
# Test basic t-shirt query
curl -X POST http://localhost:3000/api/ai-chat \
  -H "Content-Type: application/json" \
  -d '{"message": "How many large T-shirts are left?"}'

# Test volunteer stats
curl -X POST http://localhost:3000/api/ai-chat \
  -H "Content-Type: application/json" \
  -d '{"message": "Give me volunteer count by seva category"}'

# Test check-in query
curl -X POST http://localhost:3000/api/ai-chat \
  -H "Content-Type: application/json" \
  -d '{"message": "How many volunteers checked in today?"}'
```

### Expected Response Format
```json
{
  "reply": "We have 25 of L T-shirts remaining."
}
```

## Testing Checklist

### Before Testing
- [ ] Ensure development server is running
- [ ] Verify Google AI API key is configured
- [ ] Check database connection is working
- [ ] Authenticate as a valid user

### Functional Testing
- [ ] Test all t-shirt inventory queries
- [ ] Test volunteer statistics queries
- [ ] Test check-in statistics queries
- [ ] Test date parsing (today, yesterday, specific dates)
- [ ] Test name-based volunteer lookup
- [ ] Test error handling for invalid queries
- [ ] Test response formatting and readability

### Performance Testing
- [ ] Test response time for complex queries
- [ ] Test with large datasets
- [ ] Test concurrent requests

### Error Handling
- [ ] Test with invalid API key
- [ ] Test with database connection issues
- [ ] Test with malformed requests
- [ ] Test with empty/null inputs

## Common Issues and Solutions

### Issue: "Sorry, I encountered an error"
- Check Google AI API key is correctly set
- Verify database connection
- Check server logs for detailed error messages

### Issue: "I didn't understand that"
- The query may not match any supported intents
- Try rephrasing using the example queries above
- Check if the query is too complex or ambiguous

### Issue: "No data found"
- Verify the requested data exists in the database
- Check spelling of seva categories or volunteer names
- Ensure the date format is correct

## Integration Testing

### With Authentication
1. Test access without authentication (should redirect to login)
2. Test access with different user roles (volunteer, admin, team_lead)
3. Test impersonation functionality

### With Navigation
1. Verify "Ask AI" link appears in navigation
2. Test navigation between pages
3. Verify proper routing and page rendering

### With Database
1. Test with real data from development database
2. Test with empty database
3. Test with corrupted/missing data