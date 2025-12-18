# 1
Read(prisma/migrations/20251218074227_init/migration.sql)                                                                                                                                                                                                                   
    Read 100 lines                                                                                                                                                                                                                                                           
                                                                                                                                                                                                                                                                              
⏺ Bash(npx prisma db execute --stdin <<'EOF'                                                                                                                                                                                                                                  
      SELECT id, name FROM "project_types" LIMIT 1;…)                                                                                                                                                                                                                         
    Script executed successfully.                    

bash(PGPASSWORD=postgres psql -h localhost -U postgres -d reqmgmt -c "SELECT id, name FROM project_types LIMIT 1;")                                                                                                                                                         
                      id                  |         name                                                                                                                                                                                                                     
     --------------------------------------+----------------------                                                                                                                                                                                                            
      07830a70-e4ab-4dc2-ab5a-3abbbaafe07c | Software Development                                                                                                                                                                                                             
     (1 row)                                                                                                                                                                                                                                                                  
                                                                                                                                                                                                                                                                              
⏺ Now I have a project type ID. Let me test creating a project.    

# 2



TOKEN="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiI2ZmYyZjFiYi0zZmMyLTQ3YWUtYWJlYi00NjFiNWY2ZjUxNTQiLCJlbWFpbCI6ImFkbWluQGV4YW1wbGUuY29tIiwidXNlcm5hbWUiOiJhZG1pbiIsInVzZXJUeXBlIjoiU1VQRVJfQURNSU4iLCJpYXQiOjE3NjYwNjk1OTMsImV4cCI6MTc2NjA3MDQ5M30.9qD-r93e46BC_-92   
   C3b9bUVTpvZIAJQO3qKyjO6j3Qk" && \                                                                                                                                                                                                                                          
   curl -X POST http://localhost:4000/graphql \                                                                                                                                                                                                                               
     -H "Content-Type: application/json" \                                                                                                                                                                                                                                    
     -H "Authorization: Bearer $TOKEN" \                                                                                                                                                                                                                                      
     -d @- <<'EOF'                                                                                                                                                                                                                                                            
   {                                                                                                                                                                                                                                                                          
     "query": "mutation { createProject(input: { name: \"Test Project\", code: \"TEST-001\", description: \"A test project\", projectTypeId: \"07830a70-e4ab-4dc2-ab5a-3abbbaafe07c\" }) { id name code description isActive } }"                                             
   }                                                                                                                                                                                                                                                                          
   EOF 

   