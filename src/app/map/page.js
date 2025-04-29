'use client';
import { useState, useEffect } from 'react';
import { MapContainer, TileLayer, Popup, CircleMarker, ZoomControl } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import dynamic from 'next/dynamic';
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { Card, Container, Row, Col, Button, Form, Badge, Tabs, Tab, Alert, ProgressBar, ButtonGroup, OverlayTrigger, Tooltip as BSTooltip } from 'react-bootstrap';
import 'bootstrap/dist/css/bootstrap.min.css';

// Import the marker icons (use dynamic import to avoid SSR issues)
const MapMarker = dynamic(
  () => import('../../components/MarkerIcon').then(() => import('react-leaflet').then(mod => mod.Marker)),
  { ssr: false }
);

export default function JobMarketMap() {
  const [location, setLocation] = useState({ lat: 15.2993, lng: 74.1240 }); // Default: Goa
  const [trendingSkills, setTrendingSkills] = useState([]);
  const [jobDemands, setJobDemands] = useState([]);
  const [regionalJobs, setRegionalJobs] = useState([]);
  const [selectedRegion, setSelectedRegion] = useState('Goa');
  const [jobHotspots, setJobHotspots] = useState([]);
  const [skillTrend, setSkillTrend] = useState({});
  const [activeTab, setActiveTab] = useState('map');
  const [loadingLocation, setLoadingLocation] = useState(false);
  const [educationLevel, setEducationLevel] = useState('bachelors');
  const [careerStage, setCareerStage] = useState('entry');
  
  // Enhanced data structure with education level relevance
  const skillsData = [
    { name: 'React', demand: 85, relevance: { bachelors: 85, masters: 80, phd: 65 } },
    { name: 'Python', demand: 92, relevance: { bachelors: 85, masters: 95, phd: 98 } },
    { name: 'Data Science', demand: 78, relevance: { bachelors: 70, masters: 90, phd: 95 } },
    { name: 'Cloud', demand: 88, relevance: { bachelors: 85, masters: 88, phd: 75 } },
    { name: 'DevOps', demand: 75, relevance: { bachelors: 80, masters: 75, phd: 60 } },
    { name: 'Machine Learning', demand: 82, relevance: { bachelors: 65, masters: 90, phd: 98 } },
    { name: 'Blockchain', demand: 72, relevance: { bachelors: 68, masters: 75, phd: 85 } },
  ];
  
  const industryData = [
    { name: 'IT', growth: 12, educationFit: { bachelors: 'high', masters: 'high', phd: 'medium' } },
    { name: 'Tourism', growth: 18, educationFit: { bachelors: 'high', masters: 'medium', phd: 'low' } },
    { name: 'Finance', growth: 7, educationFit: { bachelors: 'high', masters: 'high', phd: 'high' } },
    { name: 'Hospitality', growth: 15, educationFit: { bachelors: 'high', masters: 'medium', phd: 'low' } },
    { name: 'Education', growth: 6, educationFit: { bachelors: 'medium', masters: 'high', phd: 'very high' } },
    { name: 'Research', growth: 9, educationFit: { bachelors: 'low', masters: 'high', phd: 'very high' } },
  ];
  
  // Career progression paths based on education level
  const careerPaths = {
    'bachelors': [
      { stage: 'entry', title: 'Junior Developer', avgSalary: '₹4-6 LPA', skills: ['JavaScript', 'HTML/CSS', 'React Basics'] },
      { stage: 'mid', title: 'Senior Developer', avgSalary: '₹8-12 LPA', skills: ['System Design', 'Advanced React', 'Cloud Services'] },
      { stage: 'senior', title: 'Team Lead', avgSalary: '₹15-20 LPA', skills: ['Team Management', 'Architecture', 'Project Planning'] }
    ],
    'masters': [
      { stage: 'entry', title: 'Specialist Engineer', avgSalary: '₹7-10 LPA', skills: ['Data Structures', 'Algorithms', 'Specialized Domain'] },
      { stage: 'mid', title: 'Technical Architect', avgSalary: '₹15-22 LPA', skills: ['System Architecture', 'Performance Optimization', 'Technical Leadership'] },
      { stage: 'senior', title: 'Engineering Manager', avgSalary: '₹25-35 LPA', skills: ['Department Strategy', 'Technical Vision', 'Executive Communication'] }
    ],
    'phd': [
      { stage: 'entry', title: 'Research Scientist', avgSalary: '₹12-18 LPA', skills: ['Deep Learning', 'Research Methods', 'Scientific Writing'] },
      { stage: 'mid', title: 'Principal Scientist', avgSalary: '₹20-30 LPA', skills: ['Research Leadership', 'Grant Writing', 'Innovation Management'] },
      { stage: 'senior', title: 'Director of R&D', avgSalary: '₹35-50+ LPA', skills: ['Research Strategy', 'Department Management', 'Industry Partnerships'] }
    ]
  };
  
  const regions = {
    'Goa': { 
      lat: 15.2993, 
      lng: 74.1240, 
      jobs: [
        { 
          title: 'Frontend Developer', 
          company: 'TechBeach', 
          skills: ['React', 'JavaScript', 'UI/UX'],
          educationLevel: 'bachelors',
          careerStage: 'entry',
          salary: '₹5-7 LPA'
        },
        { 
          title: 'Tourism Tech Lead', 
          company: 'Goa Experiences', 
          skills: ['Mobile Apps', 'UX Design', 'API Integration'],
          educationLevel: 'bachelors',
          careerStage: 'mid',
          salary: '₹10-14 LPA'
        },
        { 
          title: 'Hotel Management System Developer', 
          company: 'Resort Solutions', 
          skills: ['Full Stack', 'Database Design', 'Cloud Deployment'],
          educationLevel: 'bachelors',
          careerStage: 'entry',
          salary: '₹6-8 LPA'
        },
        { 
          title: 'Data Scientist', 
          company: 'TravelAnalytics', 
          skills: ['Python', 'Machine Learning', 'Data Visualization'],
          educationLevel: 'masters',
          careerStage: 'entry',
          salary: '₹8-12 LPA'
        },
        { 
          title: 'Research Lead', 
          company: 'Marine Research Institute', 
          skills: ['Marine Biology', 'Research Methods', 'Grant Writing'],
          educationLevel: 'phd',
          careerStage: 'mid',
          salary: '₹18-25 LPA'
        }
      ],
      hotspots: [
        { lat: 15.3960, lng: 73.8432, name: 'Panaji Tech Hub', jobs: 15, educationFocus: ['bachelors', 'masters'] },
        { lat: 15.2132, lng: 73.9794, name: 'Margao Innovation Center', jobs: 8, educationFocus: ['bachelors', 'masters'] },
        { lat: 15.5916, lng: 73.7389, name: 'Mapusa Digital Zone', jobs: 12, educationFocus: ['bachelors'] },
        { lat: 15.3855, lng: 73.7989, name: 'Marine Research Center', jobs: 5, educationFocus: ['phd', 'masters'] }
      ]
    },
    'Mumbai': { 
      lat: 19.0760, 
      lng: 72.8777, 
      jobs: [
        { 
          title: 'Frontend Engineer', 
          company: 'FinTech Solutions', 
          skills: ['React', 'TypeScript', 'CSS'],
          educationLevel: 'bachelors',
          careerStage: 'entry',
          salary: '₹7-10 LPA'
        },
        { 
          title: 'ML Engineer', 
          company: 'AI Innovations', 
          skills: ['TensorFlow', 'Python', 'Computer Vision'],
          educationLevel: 'masters',
          careerStage: 'entry',
          salary: '₹12-16 LPA'
        },
        { 
          title: 'Product Designer', 
          company: 'UX Studios', 
          skills: ['Figma', 'User Research', 'Prototyping'],
          educationLevel: 'bachelors',
          careerStage: 'mid',
          salary: '₹14-18 LPA'
        },
        { 
          title: 'Research Director', 
          company: 'Financial Research Group', 
          skills: ['Quantitative Analysis', 'Financial Models', 'Research Leadership'],
          educationLevel: 'phd',
          careerStage: 'senior',
          salary: '₹35-45 LPA'
        }
      ],
      hotspots: [
        { lat: 19.1136, lng: 72.9080, name: 'Powai Startup Village', jobs: 25, educationFocus: ['bachelors', 'masters'] },
        { lat: 19.0176, lng: 72.8561, name: 'BKC Financial District', jobs: 18, educationFocus: ['bachelors', 'masters', 'phd'] },
        { lat: 18.9548, lng: 72.8224, name: 'South Mumbai Tech Park', jobs: 10, educationFocus: ['bachelors'] },
        { lat: 19.1290, lng: 72.9149, name: 'IIT Research Park', jobs: 12, educationFocus: ['phd', 'masters'] }
      ]
    },
    // ...existing code for Bangalore and Delhi NCR regions...
  };
  
  // Enhanced time-series data for skill trend analysis
  const skillTrendData = {
    labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'],
    datasets: [
      {
        label: 'React',
        data: [65, 70, 75, 82, 85, 88],
        borderColor: 'rgba(255, 99, 132, 1)',
        backgroundColor: 'rgba(255, 99, 132, 0.2)',
      },
      {
        label: 'Python',
        data: [70, 75, 80, 85, 88, 92],
        borderColor: 'rgba(54, 162, 235, 1)',
        backgroundColor: 'rgba(54, 162, 235, 0.2)',
      },
      {
        label: 'Cloud',
        data: [60, 68, 75, 80, 83, 88],
        borderColor: 'rgba(75, 192, 192, 1)',
        backgroundColor: 'rgba(75, 192, 192, 0.2)',
      },
      {
        label: 'Machine Learning',
        data: [55, 62, 70, 75, 80, 82],
        borderColor: 'rgba(153, 102, 255, 1)',
        backgroundColor: 'rgba(153, 102, 255, 0.2)',
      },
    ],
  };
  
  useEffect(() => {
    // Filter data based on education level
    const filteredSkills = skillsData.map(skill => ({
      name: skill.name,
      demand: skill.relevance[educationLevel]
    }));
    
    setTrendingSkills(filteredSkills);
    setJobDemands(industryData);
    setSkillTrend(skillTrendData);
    
    // Set regional jobs and hotspots based on selected region
    if (regions[selectedRegion]) {
      setLocation({ lat: regions[selectedRegion].lat, lng: regions[selectedRegion].lng });
      
      // Filter jobs based on education level and career stage
      const filteredJobs = regions[selectedRegion].jobs.filter(job => 
        job.educationLevel === educationLevel && 
        job.careerStage === careerStage
      );
      
      // If no jobs match the exact criteria, show all jobs for that education level
      setRegionalJobs(filteredJobs.length > 0 
        ? filteredJobs 
        : regions[selectedRegion].jobs.filter(job => job.educationLevel === educationLevel)
      );
      
      // Filter hotspots relevant to the selected education level
      setJobHotspots(regions[selectedRegion].hotspots.filter(hotspot => 
        hotspot.educationFocus.includes(educationLevel)
      ));
    }
  }, [selectedRegion, educationLevel, careerStage]);
  
  // Get user geolocation
  const getUserLocation = () => {
    setLoadingLocation(true);
    navigator.geolocation.getCurrentPosition(
      (position) => {
        setLocation({
          lat: position.coords.latitude,
          lng: position.coords.longitude
        });
        setLoadingLocation(false);
      },
      (error) => {
        console.error("Error getting user location:", error);
        setLoadingLocation(false);
        alert("Could not get your location. Please check your permissions.");
      }
    );
  };
  
  // Chart options
  const barOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top',
      },
      title: {
        display: true,
        text: 'Demand Score (0-100)',
      },
    },
  };
  
  const lineOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top',
      },
      title: {
        display: true,
        text: '6-Month Skill Demand Trend',
      },
    },
  };

  // Prepare chart data
  const chartData = {
    labels: trendingSkills.map(item => item.name),
    datasets: [
      {
        label: 'Demand Score',
        data: trendingSkills.map(item => item.demand),
        backgroundColor: 'rgba(75, 192, 192, 0.6)',
      }
    ]
  };
  
  const industryChartData = {
    labels: jobDemands.map(item => item.name),
    datasets: [
      {
        label: 'Growth % YoY',
        data: jobDemands.map(item => item.growth),
        backgroundColor: 'rgba(153, 102, 255, 0.6)',
      }
    ]
  };

  return (
    <Container fluid className="p-4 bg-light">
      <Card className="shadow mb-4">
        <Card.Body>
          <h1 className="text-primary mb-0">Career Opportunity Navigator</h1>
          <p className="text-muted">Professional career mapping and analysis for graduates</p>
        </Card.Body>
      </Card>
      
      <Row>
        <Col lg={3} md={4} className="mb-4">
          <Card className="shadow h-100">
            <Card.Body>
              <Card.Title className="border-bottom pb-2 d-flex align-items-center">
                <i className="bi bi-sliders me-2"></i>
                Career Parameters
              </Card.Title>
              
              <Form.Label className="mt-3 mb-1 fw-bold">Education Level</Form.Label>
              <Form.Select 
                value={educationLevel} 
                onChange={(e) => setEducationLevel(e.target.value)}
                className="mb-3"
              >
                <option value="bachelors">Bachelor's Degree</option>
                <option value="masters">Master's Degree</option>
                <option value="phd">PhD / Doctorate</option>
              </Form.Select>
              
              <Form.Label className="mt-2 mb-1 fw-bold">Career Stage</Form.Label>
              <ButtonGroup className="w-100 mb-3">
                <Button 
                  variant={careerStage === 'entry' ? 'primary' : 'outline-primary'}
                  onClick={() => setCareerStage('entry')}
                >
                  Entry
                </Button>
                <Button 
                  variant={careerStage === 'mid' ? 'primary' : 'outline-primary'}
                  onClick={() => setCareerStage('mid')}
                >
                  Mid-Level
                </Button>
                <Button 
                  variant={careerStage === 'senior' ? 'primary' : 'outline-primary'}
                  onClick={() => setCareerStage('senior')}
                >
                  Senior
                </Button>
              </ButtonGroup>
              
              <Form.Label className="mt-3 mb-1 fw-bold">Region</Form.Label>
              <Form.Select 
                value={selectedRegion} 
                onChange={(e) => setSelectedRegion(e.target.value)}
                className="mb-3"
              >
                {Object.keys(regions).map(region => (
                  <option key={region} value={region}>{region}</option>
                ))}
              </Form.Select>
              
              <Button 
                variant="secondary" 
                className="w-100 mb-3"
                onClick={getUserLocation}
                disabled={loadingLocation}
              >
                <i className="bi bi-geo-alt me-2"></i>
                {loadingLocation ? 'Locating...' : 'Use My Current Location'}
              </Button>
              
              <Card className="bg-light border-0 mt-3">
                <Card.Body className="p-2">
                  <h6 className="text-primary">Career Path Progression</h6>
                  {careerPaths[educationLevel] && (
                    <>
                      <div className="d-flex align-items-center mb-2">
                        <div style={{width: '30%'}} className="small">Entry Level</div>
                        <ProgressBar style={{height: '8px', width: '70%'}} variant={careerStage === 'entry' ? 'primary' : 'secondary'} now={100} />
                      </div>
                      <div className="d-flex align-items-center mb-2">
                        <div style={{width: '30%'}} className="small">Mid Level</div>
                        <ProgressBar style={{height: '8px', width: '70%'}} variant={careerStage === 'mid' ? 'primary' : 'secondary'} now={100} />
                      </div>
                      <div className="d-flex align-items-center">
                        <div style={{width: '30%'}} className="small">Senior Level</div>
                        <ProgressBar style={{height: '8px', width: '70%'}} variant={careerStage === 'senior' ? 'primary' : 'secondary'} now={100} />
                      </div>
                    </>
                  )}
                </Card.Body>
              </Card>
            </Card.Body>
          </Card>
        </Col>
        
        <Col lg={9} md={8} className="mb-4">
          <Card className="shadow h-100">
            <Card.Body>
              <Tabs
                activeKey={activeTab}
                onSelect={(k) => setActiveTab(k)}
                className="mb-3"
              >
                <Tab eventKey="map" title="Career Opportunity Map">
                  <div style={{ height: '500px', width: '100%' }}>
                    <MapContainer 
                      center={[location.lat, location.lng]} 
                      zoom={12} 
                      style={{ height: '100%', width: '100%', borderRadius: '8px' }}
                      zoomControl={false}
                    >
                      <ZoomControl position="bottomright" />
                      <TileLayer
                        url="https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png"
                        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>'
                      />
                      
                      {/* Main region marker */}
                      <MapMarker position={[location.lat, location.lng]}>
                        <Popup>
                          <div className="text-center">
                            <h6 className="mb-1">{selectedRegion}</h6>
                            <Badge bg="info">{regionalJobs.length} opportunities</Badge>
                            <p className="small mt-2 mb-0">
                              Career hub for {educationLevel} graduates
                            </p>
                          </div>
                        </Popup>
                      </MapMarker>
                      
                      {/* Job hotspot markers */}
                      {jobHotspots.map((hotspot, index) => {
                        const opacity = hotspot.educationFocus.includes(educationLevel) ? 0.8 : 0.3;
                        const radius = Math.log(hotspot.jobs) * 5 + 8;
                        
                        return (
                          <CircleMarker 
                            key={index}
                            center={[hotspot.lat, hotspot.lng]}
                            radius={radius}
                            fillColor="#4287f5"
                            color="#2b5797"
                            weight={2}
                            opacity={opacity}
                            fillOpacity={opacity * 0.6}
                          >
                            <Popup>
                              <div className="text-center">
                                <h6 className="mb-1">{hotspot.name}</h6>
                                <Badge bg="success">{hotspot.jobs} positions</Badge>
                                <p className="small mt-2 mb-0">
                                  Ideal for: {hotspot.educationFocus.map(e => 
                                    e === 'bachelors' ? 'BSc' : e === 'masters' ? 'MSc' : 'PhD'
                                  ).join(', ')} graduates
                                </p>
                              </div>
                            </Popup>
                          </CircleMarker>
                        );
                      })}
                    </MapContainer>
                  </div>
                </Tab>
                <Tab eventKey="trends" title="Skills & Growth Analysis">
                  <div style={{ height: '500px', width: '100%' }}>
                    <ResponsiveContainer>
                      <LineChart
                        data={[...Array(skillTrendData.labels.length).keys()].map(i => ({
                          name: skillTrendData.labels[i],
                          ...skillTrendData.datasets.reduce((obj, dataset) => {
                            obj[dataset.label] = dataset.data[i];
                            return obj;
                          }, {})
                        }))}
                        margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                      >
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="name" />
                        <YAxis />
                        <Tooltip />
                        <Legend />
                        {skillTrendData.datasets.map((dataset, i) => (
                          <Line 
                            key={dataset.label}
                            type="monotone" 
                            dataKey={dataset.label}
                            stroke={dataset.borderColor}
                            activeDot={{ r: 8 }}
                          />
                        ))}
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                </Tab>
                <Tab eventKey="career" title="Career Roadmap">
                  <div className="p-2">
                    <h5 className="mb-3 text-primary">Career Progression for {educationLevel === 'bachelors' ? 'Bachelor\'s' : educationLevel === 'masters' ? 'Master\'s' : 'PhD'} Graduates</h5>
                    
                    <Row>
                      {careerPaths[educationLevel].map((path, index) => (
                        <Col md={4} key={index}>
                          <Card className={`h-100 ${path.stage === careerStage ? 'border-primary' : ''}`}>
                            <Card.Header className={path.stage === careerStage ? 'bg-primary text-white' : ''}>
                              <h6 className="mb-0">
                                {path.stage === 'entry' ? 'Entry Level' : path.stage === 'mid' ? 'Mid Level' : 'Senior Level'}
                              </h6>
                            </Card.Header>
                            <Card.Body>
                              <h5 className="mb-2">{path.title}</h5>
                              <p className="text-success mb-3">{path.avgSalary}</p>
                              <h6 className="mb-2">Required Skills:</h6>
                              <div>
                                {path.skills.map((skill, i) => (
                                  <Badge key={i} bg="light" text="dark" className="me-1 mb-1">{skill}</Badge>
                                ))}
                              </div>
                            </Card.Body>
                          </Card>
                        </Col>
                      ))}
                    </Row>
                  </div>
                </Tab>
              </Tabs>
            </Card.Body>
          </Card>
        </Col>
      </Row>
      
      <Row className="mb-4">
        <Col md={6} className="mb-4">
          <Card className="shadow h-100">
            <Card.Body>
              <Card.Title className="d-flex justify-content-between align-items-center border-bottom pb-2">
                <span>In-Demand Skills for {educationLevel === 'bachelors' ? 'Bachelor\'s' : educationLevel === 'masters' ? 'Master\'s' : 'PhD'} Graduates</span>
                <Badge bg="primary">Relevance Score</Badge>
              </Card.Title>
              <div style={{ height: '300px', width: '100%' }}>
                <ResponsiveContainer>
                  <BarChart 
                    data={trendingSkills}
                    margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Bar dataKey="demand" name="Relevance Score" fill="#8884d8" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </Card.Body>
          </Card>
        </Col>
        
        <Col md={6} className="mb-4">
          <Card className="shadow h-100">
            <Card.Body>
              <Card.Title className="d-flex justify-content-between align-items-center border-bottom pb-2">
                <span>Industry Growth Analysis</span>
                <Badge bg="success">YoY Change</Badge>
              </Card.Title>
              <div style={{ height: '300px', width: '100%' }}>
                <ResponsiveContainer>
                  <BarChart
                    data={jobDemands}
                    margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Bar dataKey="growth" name="Growth %" fill="#82ca9d" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </Card.Body>
          </Card>
        </Col>
      </Row>
      
      <Row>
        <Col>
          <Card className="shadow mb-4">
            <Card.Header className="bg-primary text-white">
              <h5 className="mb-0">
                Job Opportunities for {educationLevel === 'bachelors' ? 'Bachelor\'s' : educationLevel === 'masters' ? 'Master\'s' : 'PhD'} 
                Graduates ({careerStage === 'entry' ? 'Entry-Level' : careerStage === 'mid' ? 'Mid-Level' : 'Senior'})
              </h5>
            </Card.Header>
            <Card.Body>
              {regionalJobs.length > 0 ? (
                <Row>
                  {regionalJobs.map((job, index) => (
                    <Col md={4} key={index} className="mb-3">
                      <Card className="h-100 shadow-sm">
                        <Card.Header className="bg-light">
                          <div className="d-flex justify-content-between">
                            <h6 className="mb-0">{job.title}</h6>
                            <OverlayTrigger
                              placement="top"
                              overlay={<BSTooltip>{job.careerStage === 'entry' ? 'Entry Level' : job.careerStage === 'mid' ? 'Mid Level' : 'Senior Level'}</BSTooltip>}
                            >
                              <Badge bg={job.careerStage === 'entry' ? 'info' : job.careerStage === 'mid' ? 'warning' : 'danger'}>
                                {job.careerStage === 'entry' ? 'E' : job.careerStage === 'mid' ? 'M' : 'S'}
                              </Badge>
                            </OverlayTrigger>
                          </div>
                        </Card.Header>
                        <Card.Body>
                          <Card.Subtitle className="mb-2 text-muted">{job.company}</Card.Subtitle>
                          <div className="d-flex justify-content-between mb-3">
                            <small className="text-muted">Salary Range:</small>
                            <span className="text-success fw-bold">{job.salary}</span>
                          </div>
                          <h6 className="mb-2 small">Required Skills:</h6>
                          <div className="mb-3">
                            {job.skills.map((skill, i) => (
                              <Badge key={i} bg="light" text="dark" className="me-1 mb-1 p-2">{skill}</Badge>
                            ))}
                          </div>
                          <Button variant="outline-primary" size="sm" className="w-100">
                            View Details & Apply
                          </Button>
                        </Card.Body>
                      </Card>
                    </Col>
                  ))}
                </Row>
              ) : (
                <Alert variant="info">
                  No job opportunities found for the current combination of education level and career stage in {selectedRegion}.
                  Try adjusting your parameters or exploring other regions.
                </Alert>
              )}
            </Card.Body>
          </Card>
          
          <Card className="shadow">
            <Card.Body>
              <Card.Title className="border-bottom pb-2">Career Development Insights</Card.Title>
              <Row>
                <Col md={8}>
                  <p>
                    Based on current market analysis for {selectedRegion}, graduates with 
                    {educationLevel === 'bachelors' ? ' Bachelor\'s degrees' : educationLevel === 'masters' ? ' Master\'s degrees' : ' PhDs'} should focus on developing
                    skills in {trendingSkills.slice(0, 3).map(s => s.name).join(', ')} to maximize career opportunities.
                  </p>
                  <p>
                    For {careerStage === 'entry' ? 'entry-level' : careerStage === 'mid' ? 'mid-level' : 'senior'} positions, 
                    employers are particularly seeking candidates with strong backgrounds in 
                    {careerPaths[educationLevel].find(p => p.stage === careerStage)?.skills.slice(0, 2).join(' and ')}.
                  </p>
                </Col>
                <Col md={4} className="d-flex flex-column justify-content-center align-items-center">
                  <Button variant="success" className="w-100 mb-2">Download Career Report</Button>
                  <Button variant="outline-primary" className="w-100">Schedule Career Consultation</Button>
                </Col>
              </Row>
            </Card.Body>
          </Card>
        </Col>
      </Row>
    </Container>
  );
}