import { useEffect, useState } from 'react';
import {
  Accordion,
  AccordionDetails,
  AccordionSummary,
  Box,
  Button,
  Container,
  TextField,
  Typography,
  Card,
  ThemeProvider,
  createTheme,
  Alert,
  CircularProgress,
  RadioGroup,
  FormControlLabel,
  Radio,
} from '@mui/material';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import type { InquiryData } from '../types'; // muuta polku omaksesi
import { Link, useParams } from 'react-router-dom';

// Tumma teema: Card ja Accordion ovat Paper-komponentteja, joten niiden tausta tulee background.paper-arvosta
const darkTheme = createTheme({
  palette: {
    mode: 'dark',
    background: { paper: '#000' },
  },
  components: {
    // Poistaa tumman tilan harmaan "elevation"-sävyn, jotta tausta on täysin musta
    MuiPaper: { styleOverrides: { root: { backgroundImage: 'none' } } },
  },
});

function InquiryView() {
  const [inquiries, setInquiries] = useState<InquiryData[]>([]);
  // Vastaukset tallessa kysymyksen id:n mukaan, esim. { 3: "Hyvää ruokaa" }
  const [answers, setAnswers] = useState<Record<number, string>>({});
  const [submitStatus, setSubmitStatus] = useState<
    Record<number, { type: 'success' | 'error'; message: string }>
  >({});
  const [submitting, setSubmitting] = useState<Record<number, boolean>>({});
 
  // useParams palauttaa osoitteen parametrit, esim. /inquiry/3 → { id: "3" }
  const { id } = useParams();

  // Haetaan vain osoitteen id:tä vastaava kysely
  useEffect(() => {
    fetch(`${import.meta.env.VITE_API_URL}inquiry/${id}`)
      .then((res) => res.json())
      // Kysely palautuu objektina, joten kääritään se listaksi
      .then((data) => setInquiries(data ? [data] : []))
      .catch((err) => console.error(err));
  }, [id]);
 
  const handleChange = (questionId: number, value: string) => {
    setAnswers({ ...answers, [questionId]: value });
  };
 
  const handleSubmit = async (inquiry: InquiryData) => {
    const apiUrl = import.meta.env.VITE_API_URL;
    setSubmitting((current) => ({ ...current, [inquiry.id]: true }));
    setSubmitStatus((current) => {
      const next = { ...current };
      delete next[inquiry.id];
      return next;
    });

    try {
      // Luodaan ensin sessio
      const sessionResponse = await fetch(`${apiUrl}sessions`, {
        method: 'POST',
      });

      if (!sessionResponse.ok) {
        throw new Error('Session luominen epäonnistui');
      }

      const session = await sessionResponse.json();

      // Muodostetaan backendin odottama pyyntö
      const requestBody = {
        sessionId: session.id,
        answers: inquiry.questions.map((question) => ({
          questionId: question.id,
          text: answers[question.id] ?? '',
        })),
      };

      // Lähetetään vastaukset backendille
      const answserResponse = await fetch(`${apiUrl}answers`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody),
      });

      if(!answserResponse.ok){
        throw new Error('Vastausten tallentaminen epäonnistui');
      }

      const savedAnswers = await answserResponse.json();
      console.log('Tallenetut vastaukset: ', savedAnswers);
      setSubmitStatus((current) => ({
        ...current,
        [inquiry.id]: {
          type: 'success',
          message: 'Vastaukset tallennettiin onnistuneesti.',
        },
      }));
    } catch(error){
      console.error('Vastauksien lähetys epäonnistui:', error);
      setSubmitStatus((current) => ({
        ...current,
        [inquiry.id]: {
          type: 'error',
          message: 'Vastausten tallentaminen epäonnistui. Yritä uudelleen.',
        },
      }));
    } finally {
      setSubmitting((current) => ({ ...current, [inquiry.id]: false }));
    }
  };

  const formatDate = (date: string) =>
  new Date(date).toLocaleDateString('fi-FI');
 
  return (
    <ThemeProvider theme={darkTheme}>
    <Card sx={{minWidth: 275}} >
    {/* Raporttinapit sivun oikeassa yläkulmassa, yksi jokaiselle kyselylle */}
    <Box sx={{ display: 'flex', justifyContent: 'flex-end', flexWrap: 'wrap', gap: 1, p: 2 }}>
      {inquiries.map((inquiry) => (
        <Button
          key={inquiry.id}
          component={Link}
          to={`/report/${inquiry.id}`}
          variant="outlined"
        >
          Raportti: {inquiry.title}
        </Button>
      ))}
    </Box>
    <Container maxWidth="sm" sx={{ py: 4 }}>
      {inquiries.map((inquiry) => (
          <div key={inquiry.id} style={{ marginBottom: 48 }}>
          <Typography variant="h4" component="h1" gutterBottom>
            {inquiry.title}
          </Typography>
          <Typography color="text.secondary" gutterBottom>
            {inquiry.description}
          </Typography>
          <Typography variant="body2" sx={{ mb: 3 }}>
            Vastaa viimeistään: {formatDate(inquiry.deadlineDate)}
          </Typography>
 
          {inquiry.questions.map((q, index) => (
              <Accordion key={q.id}>
              <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                <Typography sx={{ flexGrow: 1 }}>
                  {index + 1}. {q.quest}
                </Typography>
                {answers[q.id] ? (
                    <Typography variant="body2" color="success.main" sx={{ ml: 2 }}>
                    Vastattu
                  </Typography>
                  ) : (
                    <Typography variant="body2" color="error" sx={{ ml: 2 }}>
                      *
                    </Typography>
                )}
              </AccordionSummary>
              <AccordionDetails>
                {q.type === 'RADIO' ? (
                  // Monivalinta: vastaukseksi tallentuu valitun vaihtoehdon teksti
                  <RadioGroup
                    value={answers[q.id] ?? ''}
                    onChange={(e) => handleChange(q.id, e.target.value)}
                  >
                    {q.options.map((opt) => (
                      <FormControlLabel key={opt} value={opt} control={<Radio />} label={opt} />
                    ))}
                  </RadioGroup>
                ) : (
                  <TextField
                    multiline
                    minRows={3}
                    fullWidth
                    placeholder="Kirjoita vastauksesi"
                    value={answers[q.id] ?? ''}
                    onChange={(e) => handleChange(q.id, e.target.value)}
                    />
                )}
              </AccordionDetails>
            </Accordion>
          ))}
 
          <Button
            variant="contained"
            sx={{ mt: 3 }}
            onClick={() => handleSubmit(inquiry)}
            disabled={submitting[inquiry.id]}
          >
            {submitting[inquiry.id] ? (
              <CircularProgress size={24} color="inherit" />
            ) : (
              'Lähetä vastaukset'
            )}
          </Button>
          {submitStatus[inquiry.id] && (
            <Alert severity={submitStatus[inquiry.id].type} sx={{ mt: 2 }}>
              {submitStatus[inquiry.id].message}
            </Alert>
          )}
        </div>
      ))}
    </Container>
      </Card>
    </ThemeProvider>
  );
}
 
export default InquiryView;
 