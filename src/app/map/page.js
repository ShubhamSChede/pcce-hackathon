'use client';
import { useState, useEffect } from 'react';
import { MapContainer, TileLayer, Popup, CircleMarker } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import dynamic from 'next/dynamic';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { Card, Container, Row, Col, Button, Form, Badge, Tabs, Tab, Alert } from 'react-bootstrap';
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
  
  // Mock data for demonstration
  const skillsData = [
    { name: 'React', demand: 85 },
    { name: 'Python', demand: 92 },
    { name: 'Data Science', demand: 78 },
    { name: 'Cloud', demand: 88 },
    { name: 'DevOps', demand: 75 }
  ];
  
  const industryData = [
    { name: 'IT', growth: 12 },
    { name: 'Tourism', growth: 18 },
    { name: 'Finance', growth: 7 },
    { name: 'Hospitality', growth: 15 },
    { name: 'Education', growth: 6 }
  ];
  
  const regions = {
    'Goa': { 
      lat: 15.2993, 
      lng: 74.1240, 
      jobs: [
        { title: 'Frontend Developer', company: 'TechBeach', skills: ['React', 'JavaScript', 'UI/UX'] },
        { title: 'Tourism Tech Lead', company: 'Goa Experiences', skills: ['Mobile Apps', 'UX Design', 'API Integration'] },
        { title: 'Hotel Management System Developer', company: 'Resort Solutions', skills: ['Full Stack', 'Database Design', 'Cloud Deployment'] }
      ],
      hotspots: [
        { lat: 15.3960, lng: 73.8432, name: 'Panaji Tech Hub', jobs: 15 },
        { lat: 15.2132, lng: 73.9794, name: 'Margao Innovation Center', jobs: 8 },
        { lat: 15.5916, lng: 73.7389, name: 'Mapusa Digital Zone', jobs: 12 }
      ]
    },
    'Mumbai': { 
      lat: 19.0760, 
      lng: 72.8777, 
      jobs: [
        { title: 'Frontend Engineer', company: 'FinTech Solutions', skills: ['React', 'TypeScript', 'CSS'] },
        { title: 'ML Engineer', company: 'AI Innovations', skills: ['TensorFlow', 'Python', 'Computer Vision'] },
        { title: 'Product Designer', company: 'UX Studios', skills: ['Figma', 'User Research', 'Prototyping'] }
      ],
      hotspots: [
        { lat: 19.1136, lng: 72.9080, name: 'Powai Startup Village', jobs: 25 },
        { lat: 19.0176, lng: 72.8561, name: 'BKC Financial District', jobs: 18 },
        { lat: 18.9548, lng: 72.8224, name: 'South Mumbai Tech Park', jobs: 10 }
      ]
    },
    'Bangalore': { 
      lat: 12.9716, 
      lng: 77.5946, 
      jobs: [
        { title: 'Backend Developer', company: 'StartupX', skills: ['Java', 'Spring Boot', 'PostgreSQL'] },
        { title: 'Product Manager', company: 'Product Labs', skills: ['Agile', 'User Research', 'Data Analysis'] },
        { title: 'SRE', company: 'InfraTech', skills: ['Linux', 'Monitoring', 'Cloud Infrastructure'] }
      ],
      hotspots: [
        { lat: 12.9352, lng: 77.6245, name: 'Koramangala Startup Hub', jobs: 32 },
        { lat: 12.9789, lng: 77.6406, name: 'Indiranagar Tech Park', jobs: 24 },
        { lat: 13.0159, lng: 77.5546, name: 'Whitefield IT Corridor', jobs: 28 }
      ]
    },
    'Delhi NCR': { 
      lat: 28.7041, 
      lng: 77.1025, 
      jobs: [
        { title: 'Full Stack Developer', company: 'TechCorp', skills: ['React', 'Node.js', 'MongoDB'] },
        { title: 'Data Scientist', company: 'Analytics India', skills: ['Python', 'Machine Learning', 'SQL'] },
        { title: 'DevOps Engineer', company: 'CloudTech', skills: ['AWS', 'Docker', 'Kubernetes'] }
      ],
      hotspots: [
        { lat: 28.5456, lng: 77.1660, name: 'Gurugram Cyber City', jobs: 35 },
        { lat: 28.6304, lng: 77.2177, name: 'Noida Tech Zone', jobs: 22 },
        { lat: 28.6139, lng: 77.2090, name: 'Connaught Place Business Hub', jobs: 15 }
      ]
    }
  };
  
  // Mock time-series data for skill trend analysis
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
    ],
  };
  
  useEffect(() => {
    // Simulating API fetch for real-time data
    setTrendingSkills(skillsData);
    setJobDemands(industryData);
    setSkillTrend(skillTrendData);
    
    // Set regional jobs and hotspots based on selected region
    if (regions[selectedRegion]) {
      setLocation({ lat: regions[selectedRegion].lat, lng: regions[selectedRegion].lng });
      setRegionalJobs(regions[selectedRegion].jobs);
      setJobHotspots(regions[selectedRegion].hotspots);
    }
  }, [selectedRegion]);
  
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
      <Card className="shadow-sm mb-4">
        <Card.Body>
          <h1 className="text-primary mb-0">Real-Time Job Market Insights</h1>
          <p className="text-muted">Discover trending skills, job hotspots, and industry growth in your region</p>
        </Card.Body>
      </Card>
      
      <Row>
        <Col lg={3} md={4} className="mb-4">
          <Card className="shadow-sm h-100">
            <Card.Body>
              <Card.Title className="border-bottom pb-2">Location Controls</Card.Title>
              <Form.Label className="mt-2 mb-1">Select Region</Form.Label>
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
                variant="primary" 
                className="w-100 mb-2"
                onClick={getUserLocation}
                disabled={loadingLocation}
              >
                {loadingLocation ? 'Locating...' : 'Use My Current Location'}
              </Button>
              
              <Alert variant="info" className="mt-4 mb-2 p-2 small">
                <strong>Currently viewing:</strong> {selectedRegion}
              </Alert>
              
              <div className="mt-4">
                <h6>Quick Stats</h6>
                <div className="d-flex justify-content-between">
                  <small>Top Skill:</small>
                  <Badge bg="success">Python</Badge>
                </div>
                <div className="d-flex justify-content-between mt-1">
                  <small>Top Industry:</small>
                  <Badge bg="info">Tourism</Badge>
                </div>
                <div className="d-flex justify-content-between mt-1">
                  <small>Job Hotspots:</small>
                  <Badge bg="warning">{jobHotspots.length}</Badge>
                </div>
              </div>
            </Card.Body>
          </Card>
        </Col>
        
        <Col lg={9} md={8} className="mb-4">
          <Card className="shadow-sm h-100">
            <Card.Body>
              <Tabs
                activeKey={activeTab}
                onSelect={(k) => setActiveTab(k)}
                className="mb-3"
              >
                <Tab eventKey="map" title="Job Hotspots Map">
                  <div style={{ height: '500px', width: '100%' }}>
                    <MapContainer 
                      center={[location.lat, location.lng]} 
                      zoom={11} 
                      style={{ height: '100%', width: '100%', borderRadius: '8px' }}
                    >
                      <TileLayer
                        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                      />
                      {/* Main region marker */}
                      <MapMarker position={[location.lat, location.lng]}>
                        <Popup>
                          <strong>{selectedRegion}</strong><br />
                          Main job hub with {regionalJobs.length} featured opportunities
                        </Popup>
                      </MapMarker>
                      
                      {/* Job hotspot markers */}
                      {jobHotspots.map((hotspot, index) => (
                        <CircleMarker 
                          key={index}
                          center={[hotspot.lat, hotspot.lng]}
                          radius={Math.log(hotspot.jobs) * 5}
                          fillColor="#ff7800"
                          color="#ff7800"
                          weight={1}
                          opacity={0.8}
                          fillOpacity={0.6}
                        >
                          <Popup>
                            <strong>{hotspot.name}</strong><br />
                            {hotspot.jobs} open positions
                          </Popup>
                        </CircleMarker>
                      ))}
                    </MapContainer>
                  </div>
                </Tab>
                <Tab eventKey="trends" title="Skill Trends">
                  <div style={{ height: '500px', width: '100%' }}>
                    <ResponsiveContainer>
                      <BarChart data={skillTrendData.datasets}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="label" />
                        <YAxis />
                        <Tooltip />
                        <Legend />
                        <Bar dataKey="data" fill="#8884d8" />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </Tab>
              </Tabs>
            </Card.Body>
          </Card>
        </Col>
      </Row>
      
      <Row className="mb-4">
        <Col md={6} className="mb-4">
          <Card className="shadow-sm h-100">
            <Card.Body>
              <Card.Title className="d-flex justify-content-between align-items-center border-bottom pb-2">
                <span>In-Demand Skills</span>
                <Badge bg="primary">Real-time</Badge>
              </Card.Title>
              <div style={{ height: '300px', width: '100%' }}>
                <ResponsiveContainer>
                  <BarChart data={chartData.datasets}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="label" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Bar dataKey="data" fill="#82ca9d" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </Card.Body>
          </Card>
        </Col>
        
        <Col md={6} className="mb-4">
          <Card className="shadow-sm h-100">
            <Card.Body>
              <Card.Title className="d-flex justify-content-between align-items-center border-bottom pb-2">
                <span>Industry Growth</span>
                <Badge bg="success">YoY Change</Badge>
              </Card.Title>
              <div style={{ height: '300px', width: '100%' }}>
                <ResponsiveContainer>
                  <BarChart data={industryChartData.datasets}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="label" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Bar dataKey="data" fill="#ffc658" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </Card.Body>
          </Card>
        </Col>
      </Row>
      
      <Row>
        <Col>
          <Card className="shadow-sm mb-4">
            <Card.Header className="bg-primary text-white">
              <h5 className="mb-0">Top Job Opportunities in {selectedRegion}</h5>
            </Card.Header>
            <Card.Body>
              <Row>
                {regionalJobs.map((job, index) => (
                  <Col md={4} key={index} className="mb-3">
                    <Card className="h-100 shadow-sm border-0">
                      <Card.Body>
                        <Card.Title className="h5">{job.title}</Card.Title>
                        <Card.Subtitle className="mb-2 text-muted">{job.company}</Card.Subtitle>
                        <div className="mt-3 mb-3">
                          {job.skills.map((skill, i) => (
                            <Badge key={i} bg="light" text="dark" className="me-1 mb-1 p-2">{skill}</Badge>
                          ))}
                        </div>
                        <Button variant="outline-primary" size="sm" className="w-100">
                          View Details
                        </Button>
                      </Card.Body>
                    </Card>
                  </Col>
                ))}
              </Row>
            </Card.Body>
          </Card>
          
          <Card className="shadow-sm">
            <Card.Body>
              <Card.Title className="border-bottom pb-2">Job Market Insights for {selectedRegion}</Card.Title>
              <Row>
                <Col md={8}>
                  <p>
                    Based on current trends in {selectedRegion}, {selectedRegion === 'Goa' ? 'the tourism and technology sectors are' : 'the tech sector is'} showing the strongest growth with
                    particularly high demand for professionals skilled in {selectedRegion === 'Goa' ? 'tourism technology, frontend development, and hospitality systems' : 'data science and cloud technologies'}.
                  </p>
                  <p>
                    Consider upskilling in areas with high growth potential to maximize your career opportunities in this region.
                  </p>
                </Col>
                <Col md={4} className="d-flex justify-content-center align-items-center">
                  <Button variant="success" className="w-100">Download Region Report</Button>
                </Col>
              </Row>
            </Card.Body>
          </Card>
        </Col>
      </Row>
    </Container>
  );
}