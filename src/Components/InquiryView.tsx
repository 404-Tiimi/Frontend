import { useEffect, useState } from 'react';
import {
  Accordion,
  AccordionDetails,
  AccordionSummary,
  Button,
  Container,
  TextField,
  Typography,
  Card,
  ThemeProvider,
  createTheme,
  Alert,
  CircularProgress,
} from '@mui/material';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import type { InquiryData } from '../types'; // muuta polku omaksesi

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
  const [inquiry, setInquiry] = useState<InquiryData | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState('');
  // Vastaukset tallessa kysymyksen id:n mukaan, esim. { 3: "Hyvää ruokaa" }
  const [answers, setAnswers] = useState<Record<number, string>>({});
  const [submitStatus, setSubmitStatus] = useState<
    Record<number, { type: 'success' | 'error'; message: string }>
  >({});
  const [submitting, setSubmitting] = useState<Record<number, boolean>>({});
 
  useEffect(() => {
    const inquiryId = new URLSearchParams(window.location.search).get('id');

    if (!inquiryId) {
      setLoading(false);
      setLoadError('Kyselyn tunnus puuttuu URL-osoitteesta.');
      return;
    }

    const controller = new AbortController();

    fetch(`${import.meta.env.VITE_API_URL}inquiry/${encodeURIComponent(inquiryId)}`, {
      signal: controller.signal,
    })
      .then((res) => {
        if (!res.ok) {
          throw new Error('Kyselyä ei löytynyt');
        }
        return res.json();
      })
      .then((data: InquiryData) => setInquiry(data))
      .catch((err) => {
        if (err instanceof Error && err.name !== 'AbortError') {
          console.error(err);
          setLoadError('Kyselyn lataaminen epäonnistui.');
        }
      })
      .finally(() => setLoading(false));

    return () => controller.abort();
  }, []);

  const copyShareLink = async () => {
    if (!inquiry) return;

    const shareUrl = `${window.location.origin}${window.location.pathname}?id=${inquiry.id}`;
    await navigator.clipboard.writeText(shareUrl);
  };
 
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

    <Container maxWidth="sm" sx={{ py: 4 }}>
      {loading && (
        <CircularProgress />
      )}
      {loadError && (
        <Alert severity="error">{loadError}</Alert>
      )}
      {inquiry && (
          <div style={{ marginBottom: 48 }}>
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
                <TextField
                  multiline
                  minRows={3}
                  fullWidth
                  placeholder="Kirjoita vastauksesi"
                  value={answers[q.id] ?? ''}
                  onChange={(e) => handleChange(q.id, e.target.value)}
                  />
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
          <Button
            variant="outlined"
            sx={{ mt: 3, ml: 2 }}
            onClick={copyShareLink}
          >
            Kopioi jaa-linkki
          </Button>
          {submitStatus[inquiry.id] && (
            <Alert severity={submitStatus[inquiry.id].type} sx={{ mt: 2 }}>
              {submitStatus[inquiry.id].message}
            </Alert>
          )}
        </div>
      )}
    </Container>
      </Card>
    </ThemeProvider>
  );
}
 
export default InquiryView;
 