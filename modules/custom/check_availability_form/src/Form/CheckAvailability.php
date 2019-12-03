<?php

	namespace Drupal\check_availability_form\Form;
	use Drupal\Core\Form\FormBase;
	use Drupal\Core\Form\FormStateInterface;
	use Symfony\Component\HttpFoundation\Request;
	use Drupal\Core\Url;


class CheckAvailability extends FormBase
{

	public function getFormId()
	{
		return 'check_availability_form';
	}

	public function buildForm(array $form, FormStateInterface $form_state)
	{

		$form['visitor_name'] = [
			'#type' => 'textfield',
			'#title' => $this->t('Enter Your Name:'),
			'#required' => TRUE,
		];
		$form['arriving_date'] = [
			'#type' => 'date',
          	'#title' => $this->t('Arriving Date:'),
          	'#required' => TRUE,
          	'#format' => 'm/d/Y',
		];
		$form['departure_date'] = [
			'#type' => 'date',
          	'#title' => $this->t('Departure Date:'),
          	'#required' => TRUE,
          	'#format' => 'm/d/Y',
		];
		$form['submit'] = [
			'#type' => 'submit',
          	'#value' => $this->t('CheckAvailability'),
		];
		return $form;
	}

	public function submitForm(array &$form, FormStateInterface $form_state)
	{
		// set relative internal path
		$redirect_path = "/book-room";
		$url = url::fromUserInput($redirect_path);

		// set redirect
		$form_state->setRedirectUrl($url);
		drupal_set_message('available rooms are: ');
	}

}